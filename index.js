import fetch from "node-fetch";
import fs from "fs";

const ReadingStatus = {
  WANTS_TO_READ: "WANTS_TO_READ",
  IS_READING: "IS_READING",
  FINISHED: "FINISHED",
};
const fetchBooks = (readingStatus) =>
  fetch("https://literal.club/graphql/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
    query booksByReadingStateAndHandle($limit: Int!, $offset: Int!, $readingStatus: ReadingStatus!, $handle: String!) {
			booksByReadingStateAndHandle(
				limit: $limit
				offset: $offset
				readingStatus: $readingStatus
				handle: $handle
			) {
				...BookParts
				__typename
			}
		}
    fragment BookParts on Book {
			id
			title
			subtitle
			cover
			authors {
				...AuthorMini
				__typename
			}
		}
		
		fragment AuthorMini on Author {
			id
			name
		}
      `,
      variables: {
        limit: 2,
        readingStatus,
        handle: "izaledzka",
        offset: 0,
      },
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      const books = res.data.booksByReadingStateAndHandle || [];
      const bookItems = books.map(({ title, cover, authors }) => ({
        title,
        cover,
        authors,
      }));
      return bookItems;
    });

const convertToMarkdown = async (readingStatus) => {
  const books = await fetchBooks(readingStatus);
  return books
    .map(
      (book) => `* [${book.title} by ${book.authors[0].name}](${book.cover})`
    )
    .join("\n");
};

const generateReadme = async () => {
  const readmeTemplate = fs.readFileSync("./README.template.md", {
    encoding: "utf-8",
  });

  const [isReading, finished, wantsToRead] = await Promise.all([
    convertToMarkdown(ReadingStatus.IS_READING),
    convertToMarkdown(ReadingStatus.FINISHED),
    convertToMarkdown(ReadingStatus.WANTS_TO_READ),
  ]);
console.log(isReading)
console.log(finished)
console.log(wantsToRead)
  const updatedReadme = readmeTemplate
    .replace(ReadingStatus.IS_READING, isReading)
    .replace(ReadingStatus.FINISHED, finished)
    .replace(ReadingStatus.WANTS_TO_READ, wantsToRead);

  fs.writeFileSync("./README.md", updatedReadme);
};

await generateReadme();
