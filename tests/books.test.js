process.env.NODE_ENV = "test";

const Book = require("../models/book");
const request = require("supertest");
// const jsonschema = require("jsonschema");
// const bookSchema = require("../schemas/bookSchema.json");
// const bookUpdateSchema = require("../schemas/booksUpdateSchema.json");
const db = require("../db");
const app = require("../app");
const ExpressError = require("../expressError");

beforeEach(async () => {
  let result = await db.query(`
      INSERT INTO
        books (isbn, amazon_url,author,language,pages,publisher,title,year)
        VALUES(
            '20232',
            'https://www.amazon.com/',
            'testAuthor',
            'english',
            200,
            'testPublisher',
            'test',
            2023)
        RETURNING isbn`);

  book_isbn = result.rows[0].isbn;
});

describe("/get", () => {
  test("should get all books", async () => {
    const resp = await request(app).get("/books");
    expect(resp.body.books).toEqual([
      {
        isbn: "20232",
        amazon_url: "https://www.amazon.com/",
        author: "testAuthor",
        language: "english",
        pages: 200,
        publisher: "testPublisher",
        title: "test",
        year: 2023,
      },
    ]);
    expect(resp.body.books).toHaveLength(1);
    expect(resp.body.books[0]).toHaveProperty("isbn");
  });

  test("should get /:isbn book", async () => {
    const resp = await request(app).get("/books/20232");
    expect(resp.body.book).toHaveProperty("isbn");
  });

  test("should not get any specific book", async () => {
    const resp = await request(app).get("/books/nobook");
    expect(resp.body).toHaveProperty("error");
    expect(resp.body.message).toEqual("There is no book with an isbn 'nobook");
  });
});

describe("/post", () => {
  test("should create a new book", async () => {
    const resp = await request(app).post("/books").send({
      isbn: "32794782",
      amazon_url: "https://taco.com",
      author: "mctest",
      language: "english",
      pages: 1000,
      publisher: "yeah right",
      title: "amazing times",
      year: 2000,
    });
    expect(resp.statusCode).toBe(201);
    expect(resp.body.book).toHaveProperty("isbn");
  });

  test("should not create a new book", async () => {
    const resp = await request(app).post("/books").send({
      isbn: "32794782",
    });
    expect(resp.status).toEqual(400);
  });
});

describe("/put", () => {
  test("should create a new book", async () => {
    const resp = await request(app).put(`/books/${book_isbn}`).send({
      author: "mctest",
      language: "english",
      pages: 200,
      title: "Book",
      year: 2014,
    });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body.book).toHaveProperty("author", "mctest");
  });

  test("should not create a new book", async () => {
    const resp = await request(app).put(`/books/${book_isbn}`).send({
      author: "mctest",
      doNotApprove: "notApprove",
    });
    expect(resp.statusCode).toEqual(400);
  });

  test("should not find nor create a new book", async () => {
    const resp = await request(app).put(`/books/1222222`).send({
      author: "mctest",
      language: "english",
      pages: 200,
      title: "Book",
      year: 2014,
    });
    console.log(resp.body);
    expect(resp.statusCode).toEqual(404);
    console.log(resp.error);
    expect(resp.body.message).toEqual("There is no book with an isbn '1222222");
  });
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
  await db.end();
});
