# Balatro On The Web

Run the classic card game 'Balatro' on the web using the [love.js](https://github.com/2dengine/love.js) runtime.

## Installation

This project does not need to be built, so installation is as simple as using `git clone` or downloading the source from github.

## Usage

Open the 'index.html' file as a file: url, provide the Balatro.exe file, and click the `Parse` button. The site will locate the Balatro source, extract it, and apply the neccesary web patches.

If the 'index.html' file fails when using the file: url, use a simple web server such as python's http.server module.
```sh
python -m http.server
```

## Limitations

The RNG generator on the web differes from the native RNG implementation, so seeded runs will differ to the native counterparts.

Due to the random number I chose, there are only 25565 unique seeds.

Some computers run the internal WebGL shaders differently and may result in odd colors. I have seen it as less smooth colors.

## Caching

The 'index.html' file will cache the result of the patching, so that it doesn't have to repatch the source every time you open it.

## Working Features

- Main gameplay loop
- Sound
- Autosaving

## Planned Features

- Mods (Lovely mod injector)
- Specifically the 'smods' mod, the main mod injector that most other mods use.
- More accurate RNG.

## Credits

[love.js](https://github.com/2dengine/love.js) by 2dengine (Library)

[love.js](https://github.com/Davidobot/love.js) by David Khachaturov (Emscripten Port)

[love.js](https://github.com/TannerRogalsky/love.js/) by Tanner Rogalsky (Original Port)