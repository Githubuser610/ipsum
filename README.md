# ipsum

## Description
### Overview
ipsum is a web based application that gets users to upload books to subsequently annotate on them. ipsum has basic login and logout functionality, the option to edit one's library of books, the option to edit one's profile, as well as a search bar on the main page to swiftly find a particular book. 

Upon clicking on a book, users are brought to an e-reader page with a toolbar that lets users do the following:

- Highlight
- Remove highlights
- Annotate
- Print
- Save their highlights and annotations

### The application
To create the application, Flask is used to write the web server. The front-end is written in HTML, vanilla JavaScript, CSS and jQuery (which is used for AJAX requests).

The application consists of 4 templates:
- **layout.html**
- **login.html**
- **index.html**
- **ereader.html** 

The following is a brief introduction of each template:

#### layout.html
layout.html factors out common code for the other templates. 

#### login.html
login.html displays the login cum registration page. 

#### index.html
index.html shows the home page with the library of books.

#### ereader.html
ereader.html lays out the e-reader page where users read the books. 

For each template, **main.js** handles user interaction and page-specific functionality while **main.css** describes the presentation of the web pages.

A database file **mydata.db** has been used to store the filepaths of user images, user books and their personal information.

The code for the backend can be found in **app.py** and **helpers.py**.

**print.css** is a print style sheet that manages annotation positioning during printing.

### Moving forward
Moving forward, some extensions include:
- Support for source files of other formats (EPUB, MOBI and PDF)
- Text to speech functionality
- Ability to vary font-size
- Export function
- Bookmarking
- Different highlighter colors
- Downloading books from online sources via an API

## Usage
### Installation
By following these instructions you can run this application on your local machine.

1. Download the code from github
2. Use `pip install -r requirements.txt` to install the necessary packages 
3. Type `flask run` in the console to run the application





