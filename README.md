# Iris API

This is a simple HTTP wrapper for [Iris TTS](https://github.com/victor141516/iris-tts).

## Usage

There is a single endpoint on `/api/tts`. You can use GET or POST methods.

If you use GET, then you must provide the text using a `text` query param.

If you use POST, then you must send a JSON body with a key `text` that contains the text.

Also it's using Spanish voice by default, so you must specify any other (e.g. `en-US-JennyNeural`) voice using `voice` as query param if using GET, or as JSON key if using post.

In both cases, the response will be a MP3 stream that you can pipe to VLC, an `<audio>` src, etc.