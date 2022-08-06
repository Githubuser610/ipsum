import os
import uuid
import json
from flask import Flask, flash, session, request, render_template, redirect, jsonify, send_file
from flask_session import Session
from tempfile import mkdtemp
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from helpers import login_required, validate_password, dict_factory, allowed_file


import sqlite3

# Configure application
app = Flask(__name__)

# Ensure templates
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['MAX_CONTENT_PATH'] = 1000 * 1000 * 10 # 2 MB

# Ensure reponses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure upload folder
if not os.path.isdir(os.path.join(os.getcwd(), 'user data')):
    os.makedirs(os.path.join(os.getcwd(), 'user data'))

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'user data')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

STATIC_FOLDER = os.path.join(os.getcwd(), 'static')

ALLOWED_EXTENSIONS_BOOKS = {'txt'}
ALLOWED_EXTENSIONS_IMAGES = {'png', 'jpeg', 'jpg'}


@app.route("/login", methods=["GET", "POST"])
def login():
    # Forget any user_id
    session.clear()

    with sqlite3.connect('mydata.db') as con:
        con.row_factory = dict_factory
        cur = con.cursor()
    
        if request.method == "POST":
            rows = cur.execute("SELECT * FROM users WHERE email = ?", (request.form.get("email"),)).fetchall()
            if len(rows) != 1 or not check_password_hash(rows[0]['hash'], request.form.get("password")):
                flash("Invalid email address and/or password", 'error')
                return render_template('login.html')

            # Remember which user has logged on
            session["user_id"] = rows[0]["id"]
            return redirect("/")

        else:
            return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    with sqlite3.connect('mydata.db') as con:
        con.row_factory = dict_factory
        cur = con.cursor()
    
        if request.method == "POST":
            email = request.form.get("email")

            # check db for email
            cur.execute("SELECT * FROM users WHERE email = ?", (email,))

            rows = cur.fetchall()

            if rows:
                flash("That email has been used for registration", 'error')
                return render_template('login.html')
            else:
                password = request.form.get("password")

                password_errors = validate_password(password)
                if (len(password_errors) != 0):
                    for password_error in password_errors:
                        flash('- ' + password_error, 'error')
                    return render_template('login.html')

                cfm_password = request.form.get("cfmPassword")

                if not password == cfm_password:
                    flash('Your passwords do not match!')
                    return render_template('login.html')

                firstname = request.form.get("firstName")
                lastname = request.form.get("lastName")
                password_hash = generate_password_hash(password)
                pfp_filepath = os.path.join(STATIC_FOLDER, 'img', 'profile_pic.png')

                cur.execute("INSERT INTO users (firstname, lastname, email, hash, pfp_filepath) VALUES (?,?,?,?,?)", (firstname, lastname, email, password_hash, pfp_filepath))
                con.commit()

                cur.execute("SELECT * FROM users WHERE email = ?", [email])
                rows = cur.fetchall()
                session["user_id"] = rows[0]["id"]
                flash("You were successfully registered!", 'success')
                return redirect("/")
        else:
            return redirect("/login")

@app.route("/", methods=["GET", "POST"])
@login_required
def index():
    con = sqlite3.connect('mydata.db')
    con.row_factory = dict_factory
    cur = con.cursor()

    cur.execute('SELECT * FROM books WHERE user_id = ?', (session['user_id'],))
    rows = cur.fetchall()

    cur.execute('SELECT firstname, lastname FROM users WHERE id = ?', (session['user_id'],))
    names = cur.fetchall()

    con.close()

    return render_template("index.html", rows=rows, firstName = names[0]['firstname'], lastName = names[0]['lastname'])

@app.route("/uploader", methods=["GET", 'POST'])
@login_required
def uploader():
    if request.method == "GET":
        return redirect("/")
    else:
        con = sqlite3.connect('mydata.db')
        con.row_factory = dict_factory
        cur = con.cursor()

        # check if the post request has the file part
        if 'book-upload' not in request.files:
            print('No file part')
            con.close()
            return redirect(request.url)
        book_file = request.files['book-upload']

        # if user does not select a file, the browser submits an empty file without a filename.
        if book_file.filename == "":
            flash('No selected file')
            con.close()

        pic_file = request.files['pic-upload']

        if book_file and allowed_file(book_file.filename, ALLOWED_EXTENSIONS_BOOKS):

            book_id = uuid.uuid4().hex
            book_title = request.form.get("bookTitle")

            path = os.path.join(UPLOAD_FOLDER, "user" + str(session['user_id']), book_id)
            os.makedirs(path)

            book_filename = secure_filename(book_file.filename)
            book_file.save(os.path.join(path, book_filename))

            # convert book_file to json
            with open(os.path.join(path, book_filename), "r", encoding='utf-8') as f_obj:
                lines = f_obj.readlines()

            with open(os.path.join(path, "book.json"), 'w') as f_obj:
                data = {'paragraphs': None, "annotations": None, "highlights": None}
                data['paragraphs'] = []

                span_id = 1
                for line in lines:
                    paragraph = []
                    paragraph.append({"span_id": span_id, "text": line})
                    data['paragraphs'].append(paragraph)
                    span_id += 1

                f_obj.write(json.dumps(data))

            # check if picture with valid extension was uploaded
            if pic_file and allowed_file(pic_file.filename, ALLOWED_EXTENSIONS_IMAGES):
                pic_filename = secure_filename(pic_file.filename)
                pic_file.save(os.path.join(path, pic_filename))
                cur.execute("INSERT INTO books (book_id, title, pic_filepath, book_filepath, json_filepath, user_id, filename) VALUES (?, ?, ?, ?, ?, ?, ?)",(book_id, book_title, os.path.join(path,pic_filename),os.path.join(path, book_filename), os.path.join(path, "book.json"), session['user_id'], book_filename))
            else:
                cur.execute("INSERT INTO books (book_id, title, book_filepath, json_filepath, user_id, filename) VALUES (?, ?, ?, ?, ?, ?)",(book_id, book_title, os.path.join(path, book_filename), os.path.join(path, "book.json"), session['user_id'], book_filename))

            con.commit()
            con.close()

            with open(os.path.join(path, book_filename), "r", encoding='utf-8') as f_obj:
                lines = f_obj.readlines()

            with open(os.path.join(path, "book.json"), 'w') as f_obj:
                data = {'paragraphs': None, "annotations": None, "highlights": None}
                data['paragraphs'] = []

                span_id = 0
                paragraph_id = 0
                for line in lines:
                    paragraph = {'paragraph_id': paragraph_id, 'spans':[]}
                    paragraph['spans'].append({"span_id": span_id, "text": line})
                    data['paragraphs'].append(paragraph)
                    span_id += 1
                    paragraph_id += 1

                f_obj.write(json.dumps(data))

            flash("Upload successful", "success")
            return redirect("/")

        flash("Upload unsuccessful", "error")
        return redirect("/")

@app.route("/logout")
def logout():
    '''Log user out'''

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/login")

@app.route('/userdata')
@login_required
def bookdata():
    con = sqlite3.connect('mydata.db')
    con.row_factory = dict_factory
    cur = con.cursor()

    book_id = request.args.get('q')
    cur.execute('SELECT title, book_filepath, pic_filepath FROM books WHERE user_id = ? AND book_id = ?', (session['user_id'], book_id))
    rows = cur.fetchall()

    con.close()
    return jsonify(rows[0])

@app.route('/getemail')
@login_required
def getemail():
    con = sqlite3.connect('mydata.db')
    con.row_factory = dict_factory
    cur = con.cursor()

    cur.execute('SELECT email FROM users WHERE id = ?', (session['user_id'],))
    rows = cur.fetchall()

    con.close()
    return jsonify(rows[0]['email'])

@app.route('/get_name')
@login_required
def get_name():
    con = sqlite3.connect('mydata.db')
    con.row_factory = dict_factory
    cur = con.cursor()

    cur.execute('SELECT firstname, lastname FROM users WHERE id = ?', (session['user_id'],))
    rows = cur.fetchall()

    con.close()
    return jsonify(rows[0])

@app.route('/get_pfp')
@login_required
def get_pfp():
    con = sqlite3.connect('mydata.db')
    con.row_factory = dict_factory
    cur = con.cursor()

    cur.execute('SELECT pfp_filepath FROM users WHERE id = ?', (session['user_id'],))
    rows = cur.fetchall()

    con.close()
    return send_file(rows[0]['pfp_filepath'])

@app.route('/set/<field>', methods=['POST', 'GET'])
@login_required
def set(field):
    if request.method == 'GET':
        return redirect('/')
    else:
        con = sqlite3.connect('mydata.db')
        con.row_factory = dict_factory
        cur = con.cursor()

        if field == 'pfp':
            pfp_file = request.files['upload-image-form-fileinput']

            path = os.path.join(UPLOAD_FOLDER, "user" + str(session['user_id']))

            if pfp_file and allowed_file(pfp_file.filename, ALLOWED_EXTENSIONS_IMAGES):
                cur.execute('SELECT pfp_filepath FROM users WHERE id = ?', (session['user_id'],))
                pfp_filepath = cur.fetchall()[0]['pfp_filepath']

                if pfp_filepath and pfp_filepath != os.path.join(STATIC_FOLDER, 'img','profile_pic.png'):
                    os.remove(pfp_filepath)

                pfp_filename = secure_filename(pfp_file.filename)
                
                if not os.path.isdir(path):
                    os.makedirs(path)
                pfp_file.save(os.path.join(path, pfp_filename))

                cur.execute('UPDATE users SET pfp_filepath = ? WHERE id = ?', (os.path.join(path, pfp_filename), session['user_id']))
                con.commit()
            else:
                flash('Upload unsuccessful', 'error')

        elif field == 'name':
            firstname = request.form.get('update-name-form-firstname')
            lastname = request.form.get('update-name-form-lastname')
            if firstname and lastname:
                cur.execute('UPDATE users SET firstname = ?, lastname = ? WHERE id = ?', (firstname, lastname, session['user_id']))
                con.commit()

        elif field == 'email':
            email = request.form.get('update-email-form-input')
            if email:
                cur.execute('UPDATE users SET email = ? WHERE id = ?', (email, session['user_id']))
                con.commit()
        

        con.close()
        return redirect('/')

@app.route('/delete/<book_id>', methods=['GET', 'POST'])
@login_required
def delete(book_id):
    if request.method == 'GET':
        return redirect('/')
    else:
        con = sqlite3.connect('mydata.db')
        con.row_factory = dict_factory
        cur = con.cursor()

        cur.execute('SELECT book_id FROM books WHERE user_id = ?', (session['user_id'],))
        rows = cur.fetchall()
        cur.execute('SELECT email FROM users WHERE id = ?', (session['user_id'],))
        email = cur.fetchall()[0]['email']
        
        book_ids = []
        for row in rows:
            book_ids.append(row['book_id'])

        input_email = request.form.get('book-delete-form-input')
        
        if not book_id or not book_id in book_ids:
            print('no or invalid id - redirected')
            con.close()
            return redirect('/')
        elif input_email != email:
            print("input email doesn't match")
            con.close()
            return redirect('/')
        else:
            cur.execute('SELECT book_filepath, pic_filepath,json_filepath FROM books WHERE book_id = ? AND user_id = ?', (book_id, session['user_id']))
            rows = cur.fetchall()

            cur.execute('DELETE FROM books WHERE book_id = ? AND user_id = ?', (book_id, session['user_id']))
            con.commit()
            print('deleted records')

            if rows[0]['pic_filepath'] and os.path.exists(rows[0]['pic_filepath']):
                os.remove(rows[0]['pic_filepath'])
                print('deleted pictures')
            
            if rows[0]['book_filepath'] and os.path.exists(rows[0]['book_filepath']):
                os.remove(rows[0]['book_filepath'])
                print('deleted src')

            if rows[0]['json_filepath'] and os.path.exists(rows[0]['json_filepath']):
                os.remove(rows[0]['json_filepath'])
                print('deleted json')

            os.rmdir(os.path.join(UPLOAD_FOLDER, 'user' + str(session['user_id']), book_id))

            con.close()
            return redirect('/')

@app.route('/booksettings', methods=['GET', 'POST'])
@login_required
def booksettings():
    if request.method == 'GET':
        return redirect('/')
    else:
        con = sqlite3.connect('mydata.db')
        con.row_factory = dict_factory
        cur = con.cursor()

        book_id = request.form.get('bookId')
        pic_file = request.files['picFile']
        title = request.form.get('title')
        book_file = request.files['bookFile']

        path = os.path.join(UPLOAD_FOLDER, "user" + str(session['user_id']), book_id)

        if pic_file and allowed_file(pic_file.filename, ALLOWED_EXTENSIONS_IMAGES):
            pic_filename = secure_filename(pic_file.filename)
            pic_file.save(os.path.join(path, pic_filename))

            cur.execute('UPDATE books SET pic_filepath = ? WHERE book_id = ? AND user_id = ?', (os.path.join(path, pic_filename), book_id, session['user_id']))
            con.commit()
        else:
            flash('Failed to upload image', 'error')

        if book_file and allowed_file(book_file.filename, ALLOWED_EXTENSIONS_BOOKS):
            book_filename = secure_filename(book_file.filename)
            book_file.save(os.path.join(path, book_filename))

            cur.execute('UPDATE books SET book_filepath = ? WHERE book_id = ? AND user_id = ?', (os.path.join(path, book_filename), book_id, session['user_id']))
            con.commit()
        else:
            flash('Failed to upload book', 'error')

        cur.execute('UPDATE books SET title = ? WHERE book_id = ? AND user_id = ?', (title, book_id, session['user_id']))
        con.commit()

        con.close()
        return redirect('/')


@app.route("/getimage")
@login_required
def getimage():
    con = sqlite3.connect('mydata.db')
    con.row_factory = dict_factory
    cur = con.cursor()

    bookId = request.args.get('q')

    cur.execute('SELECT pic_filepath FROM books WHERE book_id = ? AND user_id = ?', (bookId, session['user_id']))
    rows = cur.fetchall()

    con.close()
    return send_file(rows[0]['pic_filepath'])


@app.route("/ereader/<book_id>")
@login_required
def ereader(book_id):
    '''ereader service'''
    con = sqlite3.connect('mydata.db')
    con.row_factory = dict_factory
    cur = con.cursor()

    cur.execute('SELECT * FROM books WHERE book_id = ? AND user_id = ?', (book_id, session['user_id']))
    rows = cur.fetchall()

    book_ids = []
    for row in rows:
        book_ids.append(row['book_id'])
    
    if not book_id or not book_id in book_ids:
        print('no or invalid id - redirected')

        con.close()
        return redirect('/')

    with open(rows[0]['book_filepath'], "r", encoding="utf-8") as f_obj:
        text = f_obj.read()
        title = rows[0]['title']

    con.close()
    return render_template("ereader.html", title=title, text=text)

@app.route('/ereader/<book_id>/json')
@login_required
def ereader_json(book_id):
    '''get book's json'''
    con = sqlite3.connect('mydata.db')
    con.row_factory = dict_factory
    cur = con.cursor()

    cur.execute('SELECT * FROM books WHERE book_id = ? AND user_id = ?', (book_id, session['user_id']))
    rows = cur.fetchall()

    book_ids = []
    for row in rows:
        book_ids.append(row['book_id'])
    
    if not book_id or not book_id in book_ids:
        print('no or invalid id - redirected')
        con.close()
        return redirect('/')

    with open(rows[0]['json_filepath'], "r", encoding="utf-8") as f_obj:
        data = f_obj.read()
        data_json = json.loads(data)

    con.close()
    return jsonify(data_json)

@app.route('/ereader/<book_id>/save', methods=['GET', 'POST'])
@login_required
def ereader_save(book_id):
    '''get book's json'''
    if request.method == "GET":
        return redirect('/ereader/<book_id>')
    else:
        con = sqlite3.connect('mydata.db')
        con.row_factory = dict_factory
        cur = con.cursor()

        cur.execute('SELECT * FROM books WHERE book_id = ? AND user_id = ?', (book_id, session['user_id']))
        rows = cur.fetchall()

        book_ids = []
        for row in rows:
            book_ids.append(row['book_id'])
        
        if not book_id or not book_id in book_ids:
            print('no or invalid id - redirected')
            return redirect('/')

        data = request.form.get('page-data')
        with open(rows[0]['json_filepath'], "w", encoding="utf-8") as f_obj:
            f_obj.write(data)

        con.close()
        return redirect('/ereader/' + book_id)




