export interface PhotoEntry {
  id: string
  src: string          // path relative to public/, e.g. '/photos/team_outing.jpg'
  date: string         // YYYY-MM-DD
  location: string     // location in Chinese
  location_en?: string // location in English
  members?: string[]   // member names shown as pixel tags
  note?: string        // caption in Chinese
  note_en?: string     // caption in English
}

// Images go in public/photos/
export const TEAM_PHOTOS: PhotoEntry[] = [
  {
    id: '20260612-01',
    src: '/photos/20260612/IMG_2202.JPG',
    date: '2026-06-12',
    location: '台北 · 內湖',
    location_en: 'Taipei · Neihu',
    members: ['Wes', 'Jay', 'Lee', 'Margaret', 'Jared', 'Duck'],
    note: ' VC 檢討 Product',
    note_en: 'VC review for Product',
  },
  {
    id: '20260612-02',
    src: '/photos/20260612/IMG_2203.JPG',
    date: '2026-06-12',
    location: '台北 · extension 1 by 橘色',
    location_en: 'Taipei · Extension 1 by Orange',
    members: ['Wes', 'Jay', 'Lee', 'Margaret', 'Jared', 'Duck'],
    note: '去台北出差，還一起吃了懶人涮涮鍋',
    note_en: 'Went to Taipei for work, and had a lazy sukiyaki together',
  },
]
