# Quickstart Guide

This guide provides a quick way to test the core functionality of the API using `curl`. It follows the primary user acceptance scenario.

**Prerequisites**:
- The application must be running on `http://localhost:3000`.

## 1. Create a new Source

First, let's create a source for our new term.

```bash
curl -X POST http://localhost:3000/api/v1/sources \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bibliographic",
    "fields": {
      "author": "Smith, J.",
      "title": "The Flora of the Region",
      "year": "2022"
    }
  }'
```

*Save the `_id` from the response. We'll call it `SOURCE_ID`.*

## 2. Create a new Term

Now, create the term and link it to the source.

```bash
curl -X POST http://localhost:3000/api/v1/terms \
  -H "Content-Type: application/json" \
  -d '{
    "prefLabel": "Exemplum herba",
    "definition": "A species of plant used in traditional medicine.",
    "sourceIds": ["$SOURCE_ID"]
  }'
```

*Save the `_id` from the response. We'll call it `TERM_ID`.*

## 3. Retrieve the Term

Verify that the term was created correctly.

```bash
curl http://localhost:3000/api/v1/terms/$TERM_ID
```

You should see the full term object, including the populated source information.

## 4. Search for the Term

Use the search endpoint to find the new term.

```bash
curl http://localhost:3000/api/v1/search?q=Exemplum
```

The response should contain an array with the term we just created.
