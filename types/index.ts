export interface Server {
  id: string
  name: string
}

export interface Car {
  id: string
  name: string
  image_url?: string
  download_url: string
  server_id: string
}
