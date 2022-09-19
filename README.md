# Heart Rate Variability Analysis System

## Description

The heart rate variability analysis system is used for the calculation of physiological measurements such as stress level, fatigue level and exercise load. Meanwhile, with gateways, the user's location can be tracked at any time.

The system using :

-   Koa 2
-   postgres 14
-   [Zadig](https://zadig.akeo.ie/) (For Windows)

## Running

Install dependencies

```
npm install
```

```
npm install node-gyp -g
```

Required configuration

```
1. Open binding.gyp on root directory.
2. Select the file that will be generated depends on your operating system.
3. Invoke the configure & build command: node-gyp configure && node-gyp build.
```

Start a Local Server

```
npm start
```

**Note : Please make sure your PostgreSQL is running before using `npm start`**

## License

MIT &copy; [Yang Tan](https://github.com/yangtandev)
