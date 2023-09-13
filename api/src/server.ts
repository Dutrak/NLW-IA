import { fastify } from 'fastify';
import { getAllPrompts } from './routes/get-all-prompts';
import { UploadVideoRoute } from './routes/upload-video';
import { CreateTranscriptionRoute } from './routes/create-transcription';
import { GenerateAICompletionRoute } from './routes/generate-ai-completions';
import fastifyCors from '@fastify/cors';

const app = fastify();

app.register(fastifyCors, {
  origin: '*',
})

app.register(getAllPrompts)
app.register(UploadVideoRoute)
app.register(CreateTranscriptionRoute)
app.register(GenerateAICompletionRoute)

app.listen({
  port: 3333,
}).then(() => { 
  console.log('Server is running on port 3000');
})