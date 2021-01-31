process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let newBook;

beforeEach(async function () {
    const book = await db.query(`INSERT INTO books VALUES ('070116555', 'http://a.co/eobPts78', 'Matthew Landen', 'english', 165, 'Princeton University Press', 'I Do It For Me!', 2012) RETURNING *`);
    
    newBook = book.rows[0]
});

describe('GET /books', function() {
    test("returns all books", async function() {
        const resp = await request(app).get(`/books`)
        expect(resp.statusCode).toBe(200);
        expect(resp.body.books.length).toBe(1)
    })
});

describe('GET /books/:isbn', function() {
    test("returns single books", async function() {
        const resp = await request(app).get(`/books/${newBook.isbn}`)
        expect(resp.statusCode).toBe(200);
    })
    test("invalid isbn", async function() {
        const resp = await request(app).get('/books/1')
        expect(resp.statusCode).toBe(404)
        expect(resp.body.error.message).toEqual(`There is no book with an isbn of 1`)
    })
});

describe('POST /books', function() {
    test("Working post a book to database", async function() {
        const bookToPost = {
            isbn: "0701161520",
            amazon_url: "http://a.com/eobPtX2",
            author: "Dan Brown",
            language: "english",
            pages: 235,
            publisher: "Oxford Press",
            title: "Da Vinci Code",
            year: 2012
          }
        const resp = await request(app).post(`/books`).send(bookToPost)
        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({book: bookToPost})
    })
    test("Non-working post a book to database", async function() {
        const bookToPost = {
            isbn: "0701161520",
            amazon_url: "http://a.com/eobPtX2",
            // author: "Dan Brown",
            language: "english",
            // pages: 235,
            publisher: "Oxford Press",
            title: "Da Vinci Code",
            year: 2012
        }
        const resp = await request(app).post(`/books`).send(bookToPost)
        expect(resp.statusCode).toBe(400);
        expect(resp.body.error.message.length).toEqual(2)
    })

    test("Non-working post due to duplicate isbn", async function() {
        const bookToPost = {
            isbn: `${newBook.isbn}`,
            amazon_url: "http://a.com/eobPtX2",
            author: "Dan Brown",
            language: "english",
            pages: 235,
            publisher: "Oxford Press",
            title: "Da Vinci Code",
            year: 2012
        }
        const resp = await request(app).post(`/books`).send(bookToPost)
        expect(resp.body.error.code).toEqual('23505');  
    })
});

describe('PUT /books/:isbn', function() {
    test("Put (edit) a book to database", async function() {
        const bookToAdd = {
            isbn: "070116555",
            amazon_url: "http://a.com/eobPtX5",
            author: "New Author",
            language: "english",
            pages: 265,
            publisher: "New Publisher",
            title: "New Title",
            year: 2013
        }
        const resp = await request(app).put(`/books/${newBook.isbn}`).send(bookToAdd)

        expect(resp.statusCode).toBe(200);
        expect(resp.body.book).toEqual(bookToAdd)
    })
    test("Invalid Put ", async function() {
        const bookToAdd = {
            isbn: "070116555",
            amazon_url: "http://a.com/eobPtX5",
            // author: "New Author",
            language: "english",
            // pages: 265,
            // publisher: "New Publisher",
            title: "New Title",
            year: 2013
        }
        const resp = await request(app).put(`/books/${newBook.isbn}`).send(bookToAdd)
        expect(resp.statusCode).toBe(400);
        expect(resp.body.error.message.length).toEqual(3)

    })
});

describe('DELETE /books/:isbn', function() {
    test("returns single books", async function() {
        const resp = await request(app).delete(`/books/${newBook.isbn}`)
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({message: 'Book deleted'})
    })
    test("invalid isbn", async function() {
        const resp = await request(app).get('/books/1')
        expect(resp.statusCode).toBe(404)
        expect(resp.body.error.message).toEqual(`There is no book with an isbn of 1`)
    })
});

afterEach(async function () {
    await db.query("DELETE FROM books");
});
  
afterAll(async function () {
    await db.end();
});
  