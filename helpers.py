from flask import redirect, session
from functools import wraps
    
def login_required(f):
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/1.1.x/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function

# function that checks if the password meets the requirements
def validate_password(password):
    # password must have at least 8 alphanumeric characters, 1 special character / number, 1 uppercase character and no spaces.
    characters = 0
    special_characters = 0
    unacceptable_characters = 0
    uppercase_characters = 0
    spaces = 0

    for c in password:
        if c.isspace():
            spaces += 1
        elif not c.isalnum():
            special_characters += 1
            if c == "<" or c == ">":
                unacceptable_characters += 1
        elif c.isupper():
            uppercase_characters += 1
        characters += 1

    error_array = []
    
    if characters < 8:
        error_array.append("Password has less than 8 characters")
    if special_characters < 1:
        error_array.append("Password should contain at least 1 special character")
    if unacceptable_characters > 0:
        error_array.append("Password should not contain < or >")
    if spaces > 0:
        error_array.append("Password should not contain any spaces")

    return error_array

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def allowed_file(filename, ALLOWED_EXTENSIONS):
    return "." in filename and \
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS



