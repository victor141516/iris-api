import { getVoiceChunks } from 'iris-tts'
import express, { Request } from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const apiRouter = express.Router()

apiRouter.all(
  '/tts',
  async (
    req: Request<
      void,
      { ok: false; error: string },
      { text?: string; voice?: string },
      { text?: string; voice?: string }
    >,
    res,
  ) => {
    let { text, voice } = req.query
    if (req.method === 'POST') {
      text = req.body.text
      voice = req.body.voice
    }
    if (!text) {
      return res.status(400).json({ ok: false, error: 'Missing text parameter' })
    }

    const voiceIterator = getVoiceChunks(text, (voice ?? 'es-ES-AlvaroNeural') as Parameters<typeof getVoiceChunks>[1])
    res.status(200).contentType('audio/mpeg3').setHeader('Content-Disposition', 'inline')
    for await (const chunk of voiceIterator) {
      res.write(chunk)
    }
    res.end()
  },
)

app.use('/api', apiRouter)

app.listen(Number.parseInt(process.env.PORT ?? '3000'), () => {
  console.log('Ready!')
})
