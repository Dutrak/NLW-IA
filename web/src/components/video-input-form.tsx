import { FileVideo, Upload } from "lucide-react";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from "@/lib/axios";

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'sucess'

const statusMessages = {
  converting: 'Convertendo...',
  uploading: 'Carregando..',
  generating: 'Transcrevendo...',
  sucess: 'Sucesso!',
}

interface VideoInputFormProps { 
  onVideoUploaded: (id: string) => void
}

export function VideoInputForm(props: VideoInputFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('waiting');
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  function HandleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget;
    if (!files) {
      return
    }
    const selectedFile = files[0];
    setVideoFile(selectedFile);
  }

  async function convertVideoToAudio(video: File) {
    console.log("Convert Start")

    const ffmpeg = await getFFmpeg()
    await ffmpeg.writeFile('input.mp4', await fetchFile(video))

    //ffmpeg.on('log', (message) => console.log(message))
    ffmpeg.on('progress', progress => {
      console.log('Convert Progress: ' + Math.round(progress.progress * 100))
    })

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ])

    const data = await ffmpeg.readFile('output.mp3')

    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
    const audiofile = new File([audioFileBlob], 'audio.mp3', { type: 'audio/mpeg' })

    console.log("Covert Finished")
    return audiofile

  }

  async function HandleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prompt = promptInputRef.current?.value
    if (!videoFile) {
      return
    }
    setStatus('converting')
    // converter video em audio
    const audioFile = await convertVideoToAudio(videoFile)

    // enviar para o servidor através do FormData (formato multipart/form-data)
    const data = new FormData()

    data.append('file', audioFile)
    setStatus('uploading')
    const response = await api.post('/videos', data)
    const videoID = response.data.video.id
    setStatus('generating')
    await api.post(`/videos/${videoID}/transcription`, {
      prompt,
    })

    console.log ("Video ID: " + videoID)

    setStatus('sucess')
    props.onVideoUploaded(videoID)

  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null
    }
    return URL.createObjectURL(videoFile)
  }, [videoFile])

  return (
    <form onSubmit={HandleUploadVideo} className="space-y-6">
      <label htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5">
        {previewURL ? (
          <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Selecione um Video
          </>
        )}
      </label>

      <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={HandleFileSelected} />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription-prompt">Prompt de Transcrição</Label>
        <Textarea
          ref={promptInputRef}
          disabled={status != "waiting"}
          id="transcription-prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras-chave mencionadas no video separadas por virgula (,)">
        </Textarea>
      </div>

      <Button
        data-sucess={status == "sucess"}
        disabled={status != "waiting"}
        type="submit"
        className="w-full data-[sucess=true]:bg-emerald-400"
      >
        {status == "waiting" ? (
          <>
            Carregar Video
            <Upload className="w-4 h-4 ml-2" />
          </>
        ): statusMessages[status]}
      </Button>
    </form>
  )
}