# Setup
## CLI installieren   
```shell
npm i -g @nestjs/cli

optional bei Nutzung Express
npm i @types/express
```

## Hot Reload
```shell
npm i --save-dev webpack-node-externals start-server-webpack-plugin
```
Nach der Installation muss das File _webpack-hmr.config.js_ im Approot angelegt werden.   
Diese Funktion nimmt das originale webpack configuration objekt entgegen und gibt eine modifizierte
mit angewandtem HotModuleReplacementPlugin zurück.  
```typescript

const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const StartServerPlugin = require('start-server-webpack-plugin');

module.exports = function(options) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    watch: true,
    externals: [
      nodeExternals({
        whitelist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin([/\.js$/, /\.d\.ts$/]),
      new StartServerPlugin({ name: options.output.filename }),
    ],
  };
};
```
Nun muss in der main.ts die webpack bezogenen Anweisungen hinzugefügt werden, um HMR zu aktivieren
```typescript

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```
Um den Startvorgang zu vereinfachen kann die package.json erweitert werden
```json
"start:dev": "nest build --webpack --webpackPath webpack-hmr.config.js"
```
Starten dann über:
```shell
npm run start:dev
```

---

# Projekt
## Neues Projekt erstellen
```shell
nest new project-name
```

## Projekt starten
```shell
npm run start
nest start --watch
```
http://localhost:3000

---

# CLI
## CLI generate help
```shell
nest g --help
```

## Neuen Controller hinzufügen
```shellng
nest g controller controller-name
nest g co controller-name
```

---

# NestJS
## Webserver
Unter der Haube von nestjs werkelt standardmäßig Express.   
Grundsätzlich kapselt nestjs den zugrundeliegenden Webserver.   
Möchte man direkt darauf zugreifen um Features zu nutzen, so muss main.ts angepasst werden auf

von   
```typescript
const app = await NestFactory.create(AppModule);
``` 

nach
```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
``` 

## Controllers
```typescript
import { Controller, Get } from '@nestjs/common';

.- für einen Standard-Controller
|            .- optionaler path prefix, um nicht jede Route mit /cats zu beginnen 
@Controller('cats')
export class CatsController {
  .- HTTP request method decorator mit optionalem Route-Parameter 
  @Get()
  .- findAll Methode wird _nicht_ als Routenprefix genutzt!
  |  Das müsste in den Decorator eingetragen werden @Get('findAll')
  | Diese MEthode wird also aufgerufen unter http://localhost:3000/cats
  findAll(): string {
    return 'This action returns all cats';
  }
}
``` 

### Request Object
Manchmal benötigt man den detaillierten Request des Clients.   
Man kann Nest instruieren das Request Objekt des zugrundeliegendenin Webservers (Express oder Fastify) den Handler
zu injizieren.   
Das geschieht über das @Req() Attribut
```typescript
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(@Req() request: Request): string {
    return 'This action returns all cats';
  }
}
``` 
Doku zu allen Informationen, die man sich aus dem Request Object herausziehen kann:   
http://expressjs.com/en/api.html#req

Man kann sich über dieses Request Object zwar alles manuell herausziehen, in den meisten
Fällen langt es jedoch aus dedizierte Decorators zu nutzen:   

| Decorator | Pendant |
|-----------|-----|
|@Request()	| req |
|@Response(), @Res()* | res |
|@Next() | next
|@Session() |	req.session
|@Param(key?: string) | req.params / req.params[key]
|@Body(key?: string) | req.body / req.body[key]
|@Query(key?: string) | req.query / req.query[key]
|@Headers(name?: string) | req.headers / req.headers[name]
|@Ip() | req.ip

### Resources
Unterstützt werden die Decorators   
@Put()   
@Delete()   
@Patch()   
@Options()   
@Head()   
@All()

```typescript
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create(): string {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
``` 

### Route wildcards
Pattern based routes wird ebenso unterstützt.   
\* wird als wildcard genutzt und matched auf jegliche Zeichenfolge
```typescript
@Get('ab*cd')
findAll() {
  return 'This route uses a wildcard';
}
``` 
Unterstützt werden ?, +, *, und ()

### Status Code
Standardmäßig ist der Status Code _immer_ 200, ausser bei POST - dort ist es 201.   
 Mit dem Decorator @HttpCode lässt sich dieser ändern.
```typescript
import {Controller, HttpCode, Post} from '@nestjs/common';

@Post()
@HttpCode(204)
create() {
  return 'This action adds a new cat';
}
``` 
Sollte der Status Code abhängig von der Programmlogik sein,
empfiehlt es sich das Response Objekt injizieren zu lassen.

### Headers
Um einen Response-Header zu setzen kann man sich entweder das Ressponse
Objekt injizieren lassen und dann den Header aufrufen (res.header), oder
man kann Decorators nutzen
```typescript
@Post()
@Header('Cache-Control', 'none')
create() {
  return 'This action adds a new cat';
}
``` 

### Redirect
Um einen  redirect durchzuführen kann man wieder entweder auf das Response Object zugreifen,
oder den Decorator @Redirect('url') nutzen.
```typescript
@Get()
                                .- optionaler Status Code, default ist 302 (Found)
@Redirect('https://nestjs.com', 301)
``` 

Wenn man den Status Code und die redirect URL dynamisch sitzen will, dass muss der Handler
ein Objekt zurückliefern mit folgender Struktur.
Dabei werden die Argumente aus dem Redirect Decorator überschrieben!
```typescript
@Get('redirect')
@Redirect('')
redirect(): any {
    return {url: 'http://www.amazon.de', statusCode: 300};
}
``` 

### Route parameters
Um Routernparameter zu definieren (/cats/1) werden sog. Routern-Parameter-Tokens genutzt.   
Um dann auf solche Parameter zugreifen zu können, muss in der Handler-Methode der @Param() Decorator
genutzt werden.
```typescript
    @Get(':id')
    findOne(@Param() params): string {
      console.log(params.id);
      return `This action returns a #${params.id} cat`;
    }
``` 
