# lb-api-test


### Test


### Expect

#### Status only test

```js
{
  expect: 200
}
```

#### Object test

```js
{
  expect: {
    status: 200,
    body: {
      expected: 'value'
    }     
  }
}
```

#### Response custom test

```js
{
  expect: response => {
    // custom expect here
  }
}
```

#### Body custom test

```js
{
  expect: {
    body: response => {
      // custom expect here
    }     
  }
}
```
