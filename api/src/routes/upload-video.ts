import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";

// Bibliotecas do Node para manipulação de arquivos (pode ser substituído pelo BUN no futuro)
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { prisma } from "../lib/prisma";


// Transforma o pipeline em uma promise
const pump = promisify(pipeline)

export async function UploadVideoRoute(app: FastifyInstance) { 
  // Uso do fastifyMultipart para fazer upload de arquivos
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25, // 25MB
    }
  });
  app.post('/videos', async (request, reply) => { 
    const data = await request.file()

    if (!data) { 
      return reply.status(400).send({ error: 'No file uploaded' })
    }

    const extension = path.extname(data.filename)

    if (extension !== '.mp3') { 
      return reply.status(400).send({ error: 'Only .mp3 files are allowed' })
    }
    
    const filebasename = path.basename(data.filename, extension)
    const fileUploadName = `${filebasename}-${randomUUID()}${extension}`
    const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)

    await pump(data.file, fs.createWriteStream(uploadDestination))

    const video = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDestination,
      }
    })
    return {
      video,
    }
  })
}