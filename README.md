# HTTP
HTTP client based on Fetch API with built-in support for retries, timeouts, and JSON handling.

<p>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript">
  <a href="https://www.npmjs.com/package/@outloud/http"><img src="https://badgen.net/npm/v/@outloud/http/latest" alt="Version"></a>
  <a href="https://npmcharts.com/compare/@outloud/http?minimal=true"><img src="https://badgen.net/npm/dm/@outloud/http" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/@outloud/http"><img src="https://img.shields.io/npm/l/@outloud/http.svg?sanitize=true" alt="License"></a>
</p>

## Installation
```bash
npm install @outloud/http
```

## Usage
```ts
import { http } from '@outloud/http'

const data = await http.$get('https://api.example.com/data', {
  retries: 3,
  timeout: 5000
})
```

## Documentation
To learn more, check [documentation](https://http.byoutloud.com/).
