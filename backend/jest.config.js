export default {
  // Okruženje za backend
  testEnvironment: 'node',

  // Ignoriraj node_modules
  testPathIgnorePatterns: ['/node_modules/'],

  // Automatski resetiraj mockove
  clearMocks: true,

  // Datoteka za inicijalizaciju baze prije testova
  setupFilesAfterEnv: ['./tests/setup.js'],

  // Detaljan ispis u konzoli
  verbose: true,

  // Isključena pokrivenost koda (po tvojoj želji)
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],

  // Timeout povećan na 10s zbog rada s bazom
  testTimeout: 10000,

  // DODATAK ZA ES MODULE (VAŽNO):
  // Govori Jestu da ne radi transformacije jer koristimo izvorni ESM
  transform: {},
  
  // Podrška za ekstenzije datoteka
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'json', 'node'],
};