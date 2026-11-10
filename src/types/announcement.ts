export type AnnouncementCategory = 'important' | 'update' | 'maintenance' | 'other'

export type Announcement = {
  id: string
  title: string
  summary: string
  publishedAt: string
  category: AnnouncementCategory
  url: string
}

export type AnnouncementFeed = {
  version: 1
  announcements: Announcement[]
}
