document.addEventListener("DOMContentLoaded", () => {
    function isDescendant(parent, child) {
        let node = child.parentNode;
        while (node != null) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;  
        }
        return false;
    }

    function ifNodeExists(node, callback) {
        if (typeof(node) != "undefined" && node != null) {
            callback();
        }
        return
    }

    // dealing with alerts
    const closeAlert = document.querySelector('.alert-message .close');
    ifNodeExists(closeAlert, () => {
        closeAlert.addEventListener("click", () => {
            const alert = document.querySelector(".alert-message");
            alert.remove();
        })
    })

    // toggling of registration page from login page
    const registrationBtn = document.querySelector("#registration-button-id");
    ifNodeExists(registrationBtn, ()=> registrationBtn.addEventListener("click", showRegform))

    // dislays the registration form and hides the login form
    function showRegform() {
        const regFormHTML = 
        `<div class="registration-form">
            <div class="registration-form-header">
                <p class="registration-form-header-text">Register for an account</p>
                <i class="fas fa-times" id="close-regform"></i>
            </div>
            <div class="linebreak"></div>
            <div class="registration-form-body">
                <form action="/register" class="registration-actualform" method="post">
                    <div class="registration-actualform-name">
                    <input class="form-input blue registration-form-input" type="text" placeholder="First name" autofocus="on" autocomplete="off" name="firstName">
                    <input class="form-input blue registration-form-input" type="text" placeholder="Last name" autofocus="on" autocomplete="off" name="lastName">
                    </div>
                    <input class="form-input blue registration-form-input" type="email" placeholder="Email address" name="email">
                    <input class="form-input blue registration-form-input" type="password" placeholder="Password" name="password">
                    <input class="form-input blue registration-form-input" type="password" placeholder="Confirm Password" name="cfmPassword">
                    <button class="registration-button registration-button-form" type="submit">Sign Up</button>
                </form>
            </div>
        </div>`
        const loginFormBody = document.querySelector(".login-bar-body");
        loginFormBody.innerHTML = regFormHTML

        const closeBtn = document.querySelector("#close-regform");
        closeBtn.addEventListener("click", showSigninForm);
    }

    // displays the signin form
    function showSigninForm() {
        const signinFormHTML = 
        `<div class="login-bar-forms">
            <form class="login-form" action="/login" method="POST">
                <input class="login-form-input form-input blue" type="email" placeholder="Email address" autofocus="on" name="email" required>
                <input class="form-input blue login-form-input" type="password" placeholder="Password" name="password" required>
                <button type="submit">Log In</button>
            </form>
            <div class="login-bar-divider">
                <div class="linebreak"></div>
                <span>or</span>
                <div class="linebreak"></div>
            </div>
            <button class="registration-button" id="registration-button-id">Create New Account</button>
        </div>`
        const loginFormBody = document.querySelector(".login-bar-body");
        loginFormBody.innerHTML = signinFormHTML;
        const registrationBtn = document.querySelector("#registration-button-id");
        registrationBtn.addEventListener("click", showRegform)
    }

    const navbarProfileIcon = document.querySelector(".nav-bar-icons-profile")

    ifNodeExists(navbarProfileIcon, () => {
        navbarProfileIcon.addEventListener("click", () => {
            const navbarProfile = document.querySelector(".nav-bar-profile");
            navbarProfile.classList.toggle("toggle-nav-bar-profile");
        });
    });

    let currentBook = []
    const bookshelf = document.querySelector(".index-body-books");
    ifNodeExists(bookshelf, () => {
        const books = document.querySelectorAll(".book");
        if (!books) return;
        books.forEach(element => {
            element.addEventListener("dblclick", (e) => {
                window.location.assign('/ereader/' + element.dataset.bookId);
            });

            element.querySelector('.book-setting').addEventListener('click', e => {
                e.stopPropagation();
                document.body.appendChild(createBookSettingsModal(element.dataset.bookId));
                document.body.style.overflow = 'hidden';
            });
        });
    });

    function createBookSettingsModal(bookId) {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.id = 'book-settings';
        modal.innerHTML = `
        <div class='modal-content'>
            <div class='modal-header'>
                <h2>Book settings</h2>
                <i class='fa fa-close close' id='book-settings-close'></i>
            </div>
            <div class='modal-body'>
                <form id='book-settings-form' action='/booksettings' method='post'  enctype="multipart/form-data">
                    <label for='book-settings-form-pic'>Book Cover</label>
                    <!-- <p style='margin: 2px 0;'>Current image:</p> -->
                    <input type='file' name='picFile' id='book-settings-form-pic'>
                    
                    <label for='book-settings-form-title'>Title</label>
                    <input class='form-input' type='text' id='book-settings-form-title' name='title'>

                    <label for='book-settings-form-src'>Source</label>
                    <input type='file' name='bookFile' id='book-settings-form-src'>
                    <p class='warning'>Warning: Submitting a new file will replace your current book!</p>

                    <div style='display:flex; width: 100%; margin: 10px 0 5px 0;'>
                        <button id='book-settings-reset' class='btn'>Reset Changes</button>

                        <input type='hidden' name='bookId' value=''>
                        <button id='book-settings-submit' class='btn' type='submit'>Save Changes</button>
                        
                    </div>
                </form>
                <div class='linebreak'></div>
                
                <form action='/delete/${bookId}' method='POST' id='book-delete-form'>
                    <label>Delete Book</label>
                    <input  name='book-delete-form-input' class='form-input' type='text' placeholder='Key in email address to delete book' autocomplete='off' required>
                    <button id='book-settings-delete' class='btn'>Delete</button>
                </form>
            </div>
            <div class='modal-footer'>
    
            </div>`;

        modal.querySelector("input[name='bookId']").value = bookId;

        // close btn, area outside container - removes modal

        modal.addEventListener('click', e => {
            if (e.target == modal) {
                document.body.style.overflow = 'auto';
                modal.remove();
            }    
        })

        modal.querySelector('#book-settings-close').addEventListener('click', () => {
            document.body.style.overflow = 'auto';
            modal.remove();
        })

        // get user data - cover pic, title, file, email
        $.get('/userdata?q=' + bookId, data => data).done(data => {

            // Display title
            modal.querySelector('#book-settings-form-title').value = data['title'];

        });

        // reset changes will replace current modal
        modal.querySelector('#book-settings-reset').addEventListener('click', () => {
            modal.replaceWith(createBookSettingsModal(bookId));
        });

        return modal;
    }

    function createUserSettingsModal() {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.id = 'user-settings';
        modal.innerHTML = `
        <div class='modal-content'>
            <div class='modal-header'>
                <h2>User Settings</h2>
                <i class='fa fa-close close' id='user-settings-close'></i>
            </div>
            <div class='modal-body'>
                <div class='user-settings-form-field' id='usff-pfp'>
                    <div class='user-settings-pfp-edit'>
                        <img class='user-settings-pfp profile-picture' src='/get_pfp' alt='pfp'>
                        <div class='user-settings-pfp-editbtn'>
                            <i class="fas fa-pen"></i>
                        </div>
                    </div>
                </div>
                <div class='user-settings-form-field' id='usff-name'>
                    <h3>Name</h2>
                    <p class='user-settings-name'></p>
                    <div class='user-settings-name-editbtn'>
                        <i class="fas fa-pen"></i>
                    </div>
                </div>
                <div class='user-settings-form-field' id='usff-email'>
                    <h3>Email Address</h3>
                    <p class='user-settings-email'></p>
                    <div class='user-settings-email-editbtn'>
                        <i class="fas fa-pen"></i>
                    </div>
                </div>
            </div>
        </div>`;
        
        // close btn, area outside container - removes modal
        modal.addEventListener('click', e => {
            if (e.target == modal) {
                document.body.style.overflow = 'auto';
                modal.remove();
            }    
        });

        modal.querySelector('#user-settings-close').addEventListener('click', () => {
            document.body.style.overflow = 'auto';
            modal.remove();
        });

        $.get('/getemail', data => data).done(data => {
            modal.querySelector('.user-settings-email').textContent = data;
        })

        $.get('/get_name', data => data).done(data => {
            modal.querySelector('.user-settings-name').textContent = data['firstname'] + " " + data['lastname'];
        })

        modal.querySelector('.user-settings-pfp-editbtn').addEventListener('click', () => {
            function createUploadImageModal() {
                const uploadModal = document.createElement('div');
                uploadModal.classList.add('modal')
                uploadModal.id = 'upload-image';
                uploadModal.innerHTML = `
                <div class='modal-content'>
                    <div class='modal-header'>
                        <h2>Upload Photo</h2>
                        <i class='fa fa-close close' id='upload-image-close'></i>
                    </div>
                    <div class='modal-body'>
                        <form id='upload-image-form' enctype='multipart/form-data' method='post' action='/set/pfp'>
                            <div class='user-settings-pfp-edit'>
                                <img class='user-settings-pfp profile-picture' src='/get_pfp' alt='pfp'>
                                <label for='upload-image-form-fileinput'>
                                    <div class='user-settings-pfp-editbtn'>
                                        <i class="fas fa-upload"></i>
                                    </div>
                                </label>
                                <input name='upload-image-form-fileinput' id='upload-image-form-fileinput' class='hide' type='file'>
                            </div>
                            <div class='upload-image-msg' style='display:none;'>
                                <span>Error: Only .jpg, .png and .jpeg  file extensions allowed</span>
                            </div>
                            <div class='upload-image-form-btns'>
                                <button id='upload-image-form-btns-cancel' class='btn'>
                                    Cancel
                                </button>
                                <button id='upload-image-form-btns-save' class='btn disabled-btn' disabled>
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>`
                
                uploadModal.addEventListener('click', e => {
                    if (e.target == modal) {
                        uploadModal.remove();
                    }    
                })
        
                uploadModal.querySelector('#upload-image-close').addEventListener('click', () => {
                    uploadModal.remove();
                })

                uploadModal.querySelector('#upload-image-form-btns-cancel').addEventListener('click', () => {
                    uploadModal.remove();
                })

                // change in file input
                uploadModal.querySelector('#upload-image-form-fileinput').addEventListener('input', () => {
                    
                    const pfp = uploadModal.querySelector('#upload-image-form .user-settings-pfp');
                    const [file] = uploadModal.querySelector('#upload-image-form-fileinput').files;

                    // check if file is an image
                    const fileType = file['type'];
                    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg']

                    const error = uploadModal.querySelector('.upload-image-msg');

                    const submitBtn = uploadModal.querySelector('#upload-image-form-btns-save');

                    if (file && validImageTypes.includes(fileType)) {
                        // if image, display it(create url)
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('disabled-btn');
                        error.style.display = "none";
                        pfp.src = URL.createObjectURL(file);

                    } else {
                        // else, show error
                        submitBtn.disabled = true;
                        submitBtn.classList.add('disabled-btn');
                        error.style.display = 'block';
                        pfp.src = '/get_pfp';
                    }
                })

                return uploadModal;
            }

            document.body.appendChild(createUploadImageModal());
        })

        modal.querySelector('.user-settings-name-editbtn').addEventListener('click', () => {
            const p = modal.querySelector('#usff-name p');
            const div = modal.querySelector('#usff-name div');

            p.classList.add('hide');
            div.classList.add('hide');

            const field = modal.querySelector('#usff-name');

            const form = document.createElement('form');
            field.appendChild(form);

            form.id = 'update-name-form';
            form.method = 'post';
            form.action = '/set/name';
            form.innerHTML = `
                <input name='update-name-form-firstname' type='text' class='form-input' required>
                <input name='update-name-form-lastname' type='text' class='form-input' required>
                <button id='update-name-form-cancel-btn' class='icon-button' type='submit'>
                    <i class="fas fa-times"></i>
                </button>
                <button id='update-name-form-save-btn' type='submit' class='icon-button'>
                    <i class="fas fa-check"></i>
                </button>`;

            $.get('/get_name', data => data).done(data => {
                form.querySelector("input[name='update-name-form-firstname']").placeholder = 'first - ' + data['firstname'];
                form.querySelector("input[name='update-name-form-lastname']").placeholder = 'last - ' + data['lastname'];
            })

            form.querySelector('#update-name-form-cancel-btn').addEventListener('click', () => {
                p.classList.remove('hide');
                div.classList.remove('hide');
                form.remove();
            });

            
        })

        modal.querySelector('.user-settings-email-editbtn').addEventListener('click', () => {
            const p = modal.querySelector('#usff-email p');
            const div = modal.querySelector('#usff-email div');

            p.classList.add('hide');
            div.classList.add('hide');

            const field = modal.querySelector('#usff-email');

            const form = document.createElement('form');
            field.appendChild(form);

            form.id = 'update-email-form';
            form.method = 'post';
            form.action = '/set/email';
            form.innerHTML = `
                <input name='update-email-form-input' type='email' class='form-input' required>
                <button id='update-email-form-cancel-btn' class='icon-button' type='submit'>
                    <i class="fas fa-times"></i>
                </button>
                <button id='update-email-form-save-btn' type='submit' class='icon-button'>
                    <i class="fas fa-check"></i>
                </button>`;

            $.get('/getemail', data => data).done(data => {
                form.querySelector("input[name='update-email-form-input']").placeholder = data;
            })

            form.querySelector('#update-email-form-cancel-btn').addEventListener('click', () => {
                p.classList.remove('hide');
                div.classList.remove('hide');
                form.remove();
            });

            
        })

        return modal;
    }

    const userSettingsBtn = document.querySelector('.nav-bar-icons-settings');
    ifNodeExists(userSettingsBtn, () => {
        userSettingsBtn.addEventListener('click', () => {
            document.body.appendChild(createUserSettingsModal());
        })
    })

    const searchBar = document.querySelector('#nav-bar-searchbar-input');
    ifNodeExists(searchBar, () => {
        searchBar.addEventListener('input', () => {
            const books = Array.from(document.querySelectorAll('.book'));

            if (books.length == 0) {
                const noUploads = document.querySelector('#no-uploads');
                const noneFound = document.querySelector('#none-found');

                if (searchBar.value.length == 0) {
                    noUploads.classList.remove('hide');
                    noneFound.classList.add('hide');
                } else {
                    noUploads.classList.add('hide');
                    noneFound.classList.remove('hide');
                }
            } else {
                let regex = new RegExp(`${searchBar.value}`, 'i');

                const toHide = books.filter(book => !regex.test(book.innerText));
                toHide.forEach(node => node.classList.add('hide'));
                const toShow = books.filter(book => regex.test(book.innerText));
                toShow.forEach(node => node.classList.remove('hide'));
                if (toShow.length == 0) {
                    document.querySelector('#none-found').classList.remove('hide');
                } else {
                    document.querySelector('#none-found').classList.add('hide');
                }
            }
        });
    })

    // get height of line
    function getHeight(element) {
        const reader = document.querySelector(".book-reader")
        
        const pseudoPage = document.createElement('div');
        pseudoPage.classList.add('book-page');
        const pseudoPageBody = document.createElement("div");
        pseudoPageBody.classList.add("book-page-body");
        pseudoPage.appendChild(pseudoPageBody);
        
        reader.appendChild(pseudoPage)
        pseudoPage.style.visibility = 'hidden';

        element.style.visibility = "hidden";
        pseudoPageBody.appendChild(element);
        let height = element.offsetHeight + 0;
        pseudoPageBody.removeChild(element);
        element.style.visibility = "visible";

        reader.removeChild(pseudoPage);
        if (height === 0) {
            height = 20;
        }
        return height;
    }

    // returns page nodes
    function convertToPages(lines) {
        function createPage() {
            let page = document.createElement("div");
            page.classList.add("book-page");
    
            let pageHeader = document.createElement("div");
            pageHeader.classList.add("book-page-header");
    
            let pageBody = document.createElement("div");
            pageBody.classList.add("book-page-body");
    
            let pageFooter = document.createElement("div");
            pageFooter.classList.add("book-page-footer");
    
            page.appendChild(pageHeader);
            page.appendChild(pageBody);
            page.appendChild(pageFooter);
    
            return page;
        }   
        
        const reader = document.querySelector(".book-reader")
        const pageTextHeight = 670;

        let pageCount = 1;
        let nextHeight = 0;
        let newPage = true;
        let previousLine = null;

        let pageArr = [];
        for (i = 0; i < lines.length; i++) {
            nextHeight += getHeight(lines[i]);
            if (newPage) {
                let page = createPage();
                pageArr.push(page);

                // insert page number
                let pageNumber = document.createElement("p");
                pageNumber.textContent = pageCount;
                //making page number unselectable
                pageArr[pageArr.length-1].querySelector(".book-page-footer").appendChild(pageNumber);
                pageCount += 1;

                if (previousLine) {
                    pageArr[pageArr.length-1].querySelector(".book-page-body").appendChild(previousLine);
                }
            }

            if (nextHeight < pageTextHeight) {
                pageArr[pageArr.length-1].querySelector(".book-page-body").appendChild(lines[i]);
                newPage = false;
            } else {
                nextHeight = 0;
                newPage = true;
                previousLine = lines[i];
            }
        }

        return pageArr;
    }
   
    let bookRendered = false;
    // renders pages to screen
    function renderBook(pageArr, node) {
        pageArr.forEach(page => node.appendChild(page))
        bookRendered = true;
    }

    const annotationObjs = []
    const bookReader = document.querySelector(".book-reader");
    ifNodeExists(bookReader, () => {
        $.get(window.location.pathname + "/json", data => data).done(data => {

            const paragraphs = data.paragraphs
            const paragraphsHTML = paragraphs.map(paragraph => {
                const paragraphHTML = document.createElement("p");
                paragraphHTML.classList.add("book-paragraph");

                const spans = paragraph['spans']
                const spansHTML = spans.map(span => {
                    const spanHTML = document.createElement("span");
                    spanHTML.classList.add("selectable");
                    spanHTML.textContent = span['text'];
                    return spanHTML
                })

                const documentFragment = document.createDocumentFragment();
                spansHTML.forEach(spanHTML => {
                    documentFragment.appendChild(spanHTML);
                })
                paragraphHTML.appendChild(documentFragment)
                
                return paragraphHTML;
            })

            renderBook(convertToPages(paragraphsHTML), bookReader);

            let annotations = data.annotations;
            if (annotations) {
                annotations.forEach(annotation => {
                    const spansHTML = Array.from(document.querySelectorAll('.book-reader .book-page-body span'))
                    const annotationSpansId = annotation['span_ids'];
                    const annotationSpansHTML = annotationSpansId.map(annotationSpanId => {
                        return spansHTML[annotationSpanId];
                    })
                    
                    let a = new Annotation();
                    a.generateAnnotation(annotation.text, annotationSpansHTML);
                    annotationObjs.push(a);
                })
            }

            const highlights = data.highlights;
            if (highlights) {
                const spansHTML = Array.from(document.querySelectorAll('.book-reader .book-page-body span'))
                highlights.forEach(highlightId => {
                    spansHTML[highlightId].classList.add('highlighted');
                })
            }

        })

    });
    
    
    // Work in progress
    const toolBar = document.querySelector(".tool-bar")
    ifNodeExists(toolBar, () => {
        // save button
        const saveBtn = document.querySelector('#save-utility')
        saveBtn.addEventListener('click', () => {
            const data = {'paragraphs': null, 'annotations': null, 'highlights': null}
            const paragraphsHTML = Array.from(document.querySelectorAll('.book-reader p.book-paragraph'))

            const paragraphs = []
            span_id = 0;
            for (let i = 0; i < paragraphsHTML.length; i++) {
                const paragraph = {};
                const paragraphSpansHTML = Array.from(paragraphsHTML[i].querySelectorAll('span'));

                const paragraphSpans = []
                for (let j = 0; j < paragraphSpansHTML.length; j++) {
                    let paragraphSpan = {};
                    paragraphSpan.text = paragraphSpansHTML[j].textContent;
                    paragraphSpan['span_id'] = span_id;
                    span_id += 1;
                    paragraphSpans.push(paragraphSpan);
                }

                paragraph.spans = paragraphSpans;
                paragraphs.push(paragraph);
            }

            data.paragraphs = paragraphs;

            const annotations = annotationObjs.map(annotationObj => {
                return annotationObj.getJSON(annotationObj.note, annotationObj.spanNodes);
            }).filter(annotation => annotation);
            data.annotations = annotations;

            const highlightsHTML = Array.from(document.querySelectorAll('.book-reader span.highlighted'));
            const spansHTML = Array.from(document.querySelectorAll('.book-reader .book-page-body span'));
            const highlights = highlightsHTML.map(highlightHTML => {
                return spansHTML.indexOf(highlightHTML);
            })
            data.highlights = highlights;

            let saveFormDiv = document.createElement('div');
            saveFormDiv.innerHTML = `
            <form action="${window.location.pathname}/save" method="post">
                <input type='hidden' name='page-data'>
            </form>`
            saveForm = saveFormDiv.querySelector('form')
            saveForm.querySelector("input[type='hidden']").value = JSON.stringify(data);
            document.body.appendChild(saveForm);
            saveForm.submit();
            saveForm.remove;
        });
        
        //back button
        const backBtn = document.querySelector("#back-button")
        backBtn.addEventListener("click", () => {
            const homeURL = "/";
            window.location.assign(homeURL);
        })

        //print button
        const printBtn = document.querySelector("#print-utility");
        printBtn.addEventListener("click", () => {
            window.print();
        })

        //highlight button 
        const highlightBtn = document.querySelector("#highlight-utility");
        highlightBtn.addEventListener("click", () => {

            const selection = document.getSelection();
       
            const bookReader = document.querySelector(".book-reader");

            if (selection.anchorNode && selection.focusNode && isDescendant(bookReader, selection.anchorNode) && isDescendant(bookReader, selection.focusNode) && selection.anchorNode.parentElement.classList.contains("selectable") && selection.focusNode.parentElement.classList.contains("selectable")) {
                applyStyles(getSubSelections(selection), "highlighted");
                document.getSelection().empty();
            } else {
                alert("Highlight text found within the book.");
            }
        });

        //unhighlight button
        const unhighlightBtn = document.querySelector("#unhighlight-utility");
        unhighlightBtn.addEventListener("click", () => {
            const selection = document.getSelection();
         
            const bookReader = document.querySelector(".book-reader");

            if (selection.anchorNode && selection.focusNode && isDescendant(bookReader, selection.anchorNode) && isDescendant(bookReader, selection.focusNode) && selection.anchorNode.parentElement.classList.contains("selectable") && selection.focusNode.parentElement.classList.contains("selectable")) {
                removeStyles(getSubSelections(selection), 'highlighted');
                document.getSelection().empty();
            } else {
                alert("Remove highlighted text found within the book.");
                return;
            }
        });

        const annotationBtn = document.querySelector('#annotation-utility')

        annotationBtn.addEventListener("click", () => {
            let selection = document.getSelection();
            // pass in subSelections to allow function to remove highlights
            let replacementSubSelections;

            if (selection.anchorNode && selection.focusNode && isDescendant(bookReader, selection.anchorNode) && isDescendant(bookReader, selection.focusNode) && selection.anchorNode.parentElement.classList.contains("selectable") && selection.focusNode.parentElement.classList.contains("selectable")) {
                replacementSubSelections = applyStyles(getSubSelections(selection), "annotated-text");
            } else {
                alert("Annotate text found within the book.")
                return;
            }

            let annotationNodes = replacementSubSelections.map(replacementSubSelection => replacementSubSelection['node']).filter(node => {
                return node.classList.contains('annotated-text');
            });

            const annotation = new Annotation();
            annotation.createAnnotation(annotationNodes);
            annotationObjs.push(annotation);
            
            document.getSelection().empty();

            selection = document.getSelection();
        });

        
    })

    function getSubSelections(selection) {
        let subSelections = [];

        let anchorNode = selection.anchorNode;
        let anchorOffset = selection.anchorOffset;
        let focusNode = selection.focusNode;
        let focusOffset = selection.focusOffset;

        if (anchorNode.compareDocumentPosition(focusNode)== 2 || (anchorNode == focusNode && anchorOffset > focusOffset)) {
            let tmp = anchorNode;
            anchorNode = focusNode;
            focusNode = tmp;

            tmp = anchorOffset;
            anchorOffset = focusOffset;
            focusOffset = tmp;
        }

        if (focusNode == anchorNode) {
            // can be span or paragraph node
            let subSelection = {"node": anchorNode.parentElement, "start": anchorOffset, "end": focusOffset}
            subSelections.push(subSelection);
        } else {
            const firstSubSelection = {"node": anchorNode.parentElement, "start": anchorOffset, "end": anchorNode.length}
            const lastSubSelection = {"node": focusNode.parentElement, "start": 0, "end": focusOffset}
            const spanArr = Array.from(document.querySelectorAll(".book-paragraph > span"))

            // if anchor node is span, take the start index of span's parent, p
            const startIdx = spanArr.indexOf(anchorNode.parentElement);
            const lastIdx = spanArr.indexOf(focusNode.parentElement);

            subSelections.push(firstSubSelection);

            if (lastIdx - startIdx > 1) {
                for (let i = 0; i < lastIdx - startIdx - 1; i++) {
                    let node = spanArr[startIdx + i + 1]
                    subSelections.push({"node": node, "start": 0, "end": node.textContent.length})
                }
            }

            subSelections.push(lastSubSelection);
        }
        return subSelections;
    }

    // applies styles to sub selections of structure {node: ..., start: ..., end: ...}; returns replacement sub selections
    function applyStyles(subSelections, ...styles) {

        function containsAllStyles(node, styles) {
            for (let style of styles) {
                if (!node.classList.contains(style)) {
                    return false;
                }
            }
            return true;
        }

        const subSelectionsAfter = [];
        for (let i = 0; i < subSelections.length; i++) {
            if (containsAllStyles(subSelections[i]['node'], styles)) {
                subSelectionsAfter.push(subSelections[i]);
                continue;
            } else {
                const originalClasses = Array.from(subSelections[i]['node'].classList);
                
                const styled = document.createElement("span");
                styled.classList.add(...originalClasses, ...styles);

                let originalText = subSelections[i]["node"].textContent;

                styled.textContent = originalText.substr(subSelections[i]["start"], subSelections[i]["end"] - subSelections[i]["start"]);
                
                // -- Code to minimise redundant spans --
                const newNodes = []

                const leftUnstyledText = originalText.substr(0, subSelections[i]["start"])
                if (!(leftUnstyledText === "")) {
                    const leftUnstyledSpan = document.createElement("span");
                    leftUnstyledSpan.classList.add(...originalClasses);
                    leftUnstyledSpan.textContent = leftUnstyledText;
                    newNodes.push(leftUnstyledSpan);
                }

                newNodes.push(styled)

                const rightUnstyledText = originalText.substr(subSelections[i]["end"], originalText.length - subSelections[i]["end"]);
                if (!(rightUnstyledText === "")) {
                    const rightUnstyledSpan = document.createElement("span");
                    rightUnstyledSpan.classList.add(...originalClasses);
                    rightUnstyledSpan.textContent = rightUnstyledText;
                    newNodes.push(rightUnstyledSpan);
                }

                subSelections[i]["node"].replaceWith(...newNodes);

                subSelectionsAfter.push(...newNodes.map(node => {
                    return {"node": node, "start": 0, "end": node.textContent.length};
                }))
            }
        }

        // returns subselections dataset refering to all replaced nodes
        return subSelectionsAfter;
    }

    function removeStyles(subSelections, ...styles) {

        function containsSomeStyles(node, styles) {
            for (let style of styles) {
                if (node.classList.contains(style)) {
                    return true;
                }
            }
            return false;
        }

        for (let i = 0; i < subSelections.length; i++) {
            if (!containsSomeStyles(subSelections[i]['node'], styles)) {
                continue;
            } else {
                const originalClasses = Array.from(subSelections[i]['node'].classList);
                
                const unstyled = document.createElement("span");
                unstyled.classList.add(...originalClasses)
                unstyled.classList.remove(...styles);

                let originalText = subSelections[i]["node"].textContent;

                unstyled.textContent = originalText.substr(subSelections[i]["start"], subSelections[i]["end"] - subSelections[i]["start"]);
                
                // -- Code to minimise redundant spans --
                const newNodes = []

                const leftStyledText = originalText.substr(0, subSelections[i]["start"])
                if (!(leftStyledText === "")) {
                    const leftStyledSpan = document.createElement("span");
                    leftStyledSpan.classList.add(...originalClasses);
                    leftStyledSpan.textContent = leftStyledText;
                    newNodes.push(leftStyledSpan);
                }

                newNodes.push(unstyled)

                const rightStyledText = originalText.substr(subSelections[i]["end"], originalText.length - subSelections[i]["end"]);
                if (!(rightStyledText === "")) {
                    const rightStyledSpan = document.createElement("span");
                    rightStyledSpan.classList.add(...originalClasses);
                    rightStyledSpan.textContent = rightStyledText;
                    newNodes.push(rightStyledSpan);
                }

                subSelections[i]["node"].replaceWith(...newNodes);
            }
        }
    }
});

function Annotation() {

    let selfSpanNodes = null;
    let selfNote = null;
    let selfState = null;

    // highlights selected spans
    function highlightSpans(spanNodes) {
        spanNodes.forEach(spanNode => spanNode.classList.add('annotated-text'));
    }

    // removes selection
    function unhighlightSpans(spanNodes) {
        spanNodes.forEach(spanNode => spanNode.classList.remove('annotated-text'));
    }

    // removes selection
    function getUserInputNode(spanNodes) {
        const annotationBar = document.createElement("div");
        annotationBar.classList.add("annotation-positioning", "unselectable");

        annotationBar.innerHTML = `
            <div class="annotation shadow container">
                
                <div class="annotation-body">
                    <input class="annotation-body-input" type="text" placeholder="Add a note">
                </div>

                <div class="annotation-options container-horizontal">
                    <div class="annotation-cfm annotation-option">
                        <i class="fas fa-check disabled"></i>
                    </div>
                    <div class="annotation-delete annotation-option close">
                        <i class="fas fa-trash-alt icon-hover-danger"></i>
                    </div>
                </div>                    
            </div>`

        const confirmBtn = annotationBar.querySelector(".annotation-cfm");

        const inputBar = annotationBar.querySelector(".annotation-body-input");

        inputBar.addEventListener("input", () => {

            if (/^\s*$/.test(inputBar.value)) {
                confirmBtn.querySelector("i").classList.remove("icon-hover-success");
                confirmBtn.querySelector("i").classList.add("disabled");
            } else {
                confirmBtn.querySelector("i").classList.add("icon-hover-success");
                confirmBtn.querySelector("i").classList.remove("disabled");

                confirmBtn.addEventListener('click', () => {
                    const inputBar = annotationBar.querySelector(".annotation-body-input");
                    const annotation = getAnnotationNode(inputBar.value, spanNodes);
                    annotationBar.replaceWith(annotation);
                });
            }
        });

        const deleteBtn = annotationBar.querySelector(".annotation-delete");
        deleteBtn.addEventListener("click", () => {
            annotationBar.remove();
            unhighlightSpans(spanNodes);
        })
        return annotationBar;
    }

    // removes selection, note to get node
    function getAnnotationNode(note, spanNodes) {
        selfSpanNodes = spanNodes;
        selfNote = note;
        const annotation = document.createElement("div");
        annotation.classList.add("annotation-positioning", "unselectable");
        annotation.innerHTML = `<div class="annotation shadow container">
            <div class="annotation-body">
                <p class="annotation-body-text">${note}</p>
            </div>

            <div class="annotation-options container-vertical hide">
                <div class="annotation-close annotation-option close">
                    <i class="fas fa-times" ></i></div>
                <div class="annotation-edit annotation-option">
                    <i class="fas fa-pen icon-hover-primary"></i></div>
                <div class="annotation-delete annotation-option close">
                    <i class="fas fa-trash-alt icon-hover-danger"></i>
            </div>
        </div>`

        // add functionality to option bar
        const optionBar = annotation.querySelector(".annotation-options")
        annotation.addEventListener("click", e => {
            optionBar.classList.remove("hide");
        });

        const deleteBtn = annotation.querySelector(".annotation-delete");
        deleteBtn.addEventListener("click", () => {
            annotation.remove();
            unhighlightSpans(spanNodes);
            selfState = "deleted";
        });

        const closeBtn = annotation.querySelector(".annotation-close");
        closeBtn.addEventListener("click", e => {
            e.stopPropagation();
            optionBar.classList.add("hide");
        });

        const editBtn = annotation.querySelector(".annotation-edit");
        editBtn.addEventListener("click", e => {
            e.stopPropagation();

            deleteBtn.remove();
            editBtn.remove();
            closeBtn.remove();

            const confirmBtn = document.createElement("div");
            confirmBtn.classList.add("annotation-cfm", "annotation-option");
            confirmBtn.innerHTML = `<i class="fas fa-check"></i>`;
            confirmBtn.querySelector("i").classList.add("icon-hover-success");

            optionBar.appendChild(confirmBtn);
            
            const annotationBody = annotation.querySelector(".annotation-body");
            annotationBody.innerHTML = '<input class="annotation-edit-input" autofocus="autofocus">';

            annotationBody.innerHTML = `<div class="annotation-body">
                <textarea class="annotation-edit-textarea" cols="27">${note}
                </textarea>
            </div>`;

            const textarea = annotation.querySelector(".annotation-edit-textarea");
            textarea.setAttribute("style", "height:" + textarea.scrollHeight + "px; overflow-y: hidden");

            textarea.addEventListener("input", () => {
                textarea.setAttribute("style", "height:" + textarea.scrollHeight + "px; overflow-y: hidden");

                if (/^\s*$/.test(textarea.value)) {
                    confirmBtn.querySelector("i").classList.remove("icon-hover-success");
                    confirmBtn.querySelector("i").classList.add("disabled");
                } else {
                    confirmBtn.querySelector("i").classList.add("icon-hover-success");
                    confirmBtn.querySelector("i").classList.remove("disabled");
                }
            });

            confirmBtn.addEventListener('click', () => {
                if (!(/^\s*$/.test(textarea.value))) {
                annotation.replaceWith(getAnnotationNode(textarea.value, spanNodes));
                }
            });
        });
        return annotation;
    }
    
    // highlights selection and inserts a box for user's to write notes
    this.createAnnotation = function(spanNodes) {
        highlightSpans(spanNodes);

        spanNodes[spanNodes.length - 1].parentNode.parentNode.insertBefore(getUserInputNode(spanNodes), spanNodes[spanNodes.length - 1].parentNode.nextSibling);
    }

    //highlights selection, displaying the note
    this.generateAnnotation = function(note, spanNodes) {
        highlightSpans(spanNodes);

        spanNodes[spanNodes.length - 1].parentNode.parentNode.insertBefore(getAnnotationNode(note, spanNodes), spanNodes[spanNodes.length - 1].parentNode.nextSibling);
    }

    this.getJSON = function() {
        if (!selfNote || !selfSpanNodes || selfState == 'deleted') {
            return null;
        }

        // id is retrieved via .indexOf (which is determined by where the node is within the DOM)
        const spansHTML = Array.from(document.querySelectorAll('.book-reader .book-page-body span'))
        const spanIds = selfSpanNodes.map(spanNode => spansHTML.indexOf(spanNode));
        const annotationJSON = {'text': selfNote, 'span_ids': spanIds}
        return annotationJSON;
    }
}


