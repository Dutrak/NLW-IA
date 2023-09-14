import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { api } from "@/lib/axios";

type Prompt = {
  id: string;
  title: string;
  template: string;
}

interface PromptSelectProps { 
  onPromptChange: (template: string) => void
}

export function PromptSelect(props: PromptSelectProps) {
  const [prompts, setprompts] = useState<Prompt[] | null>(null)
  useEffect(() => { 
    api.get('/prompts').then(response => { 
      setprompts(response.data)
    })
  }, [])

  function handlePromptSelected(PromptId: string) { 
    const selectedPrompt = prompts?.find(prompt => prompt.id === PromptId)
    if (!selectedPrompt) { 
      return
    }
    props.onPromptChange(selectedPrompt.template)
  }

  return (
    <Select onValueChange={handlePromptSelected}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um Prompt" />
      </SelectTrigger>
      <SelectContent>
        {prompts?.map(prompt => {
          return (
            <SelectItem key={prompt.id} value={prompt.id}>
              {prompt.title}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}