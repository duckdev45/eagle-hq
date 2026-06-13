'use client'

import { useState } from 'react'

import type { Lang } from '@/types/team'
import { HQ_I18N } from '@/data/i18n'
import { TEAM_PHOTOS } from '@/data/photos'

import { Scrim } from './pixel/scrim'

interface PhotoAlbumProps {
  lang: Lang
  onClose: () => void
}

const ROTATIONS = ['rot-l', 'rot-0', 'rot-r', 'rot-l2', 'rot-r2']

export function PhotoAlbum({ lang, onClose }: PhotoAlbumProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <Scrim onClose={onClose}>
      <div className='album-modal' onClick={(e) => e.stopPropagation()}>
        <header>
          <span className='lt'>{t.photoAlbum}</span>
          <button className='x' onClick={onClose}>✕</button>
        </header>

        <div className='album-body'>
          {TEAM_PHOTOS.length === 0 ? (
            <div className='album-empty'>
              <div className='film-reel'>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={`film-cell ${i % 3 === 1 ? 'dim' : ''}`} />
                ))}
              </div>
              <div className='album-empty-msg'>{t.noPhotos}</div>
            </div>
          ) : (
            <div className='polaroid-grid'>
              {TEAM_PHOTOS.map((ph, i) => (
                <button
                  key={ph.id}
                  className={`polaroid ${ROTATIONS[i % ROTATIONS.length]}`}
                  onClick={() => setSelected(i)}
                >
                  <div className='p-img'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph.src} alt={zh ? ph.location : (ph.location_en ?? ph.location)} draggable={false} />
                  </div>
                  <div className='p-meta'>
                    <div className='p-date'>{ph.date}</div>
                    <div className='p-loc'>📍 {zh ? ph.location : (ph.location_en ?? ph.location)}</div>
                    {ph.members && ph.members.length > 0 && (
                      <div className='p-members'>
                        {ph.members.map((m) => <span key={m} className='p-tag'>{m.toUpperCase()}</span>)}
                      </div>
                    )}
                    {ph.note && (
                      <div className='p-note'>{zh ? ph.note : (ph.note_en ?? ph.note)}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected !== null && (
          <div className='polaroid-lightbox' onClick={() => setSelected(null)}>
            <div className='plb-card' onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={TEAM_PHOTOS[selected].src}
                alt={zh ? TEAM_PHOTOS[selected].location : (TEAM_PHOTOS[selected].location_en ?? TEAM_PHOTOS[selected].location)}
                draggable={false}
              />
              <div className='plb-meta'>
                <span className='plb-date'>{TEAM_PHOTOS[selected].date}</span>
                <span className='plb-loc'>📍 {zh ? TEAM_PHOTOS[selected].location : (TEAM_PHOTOS[selected].location_en ?? TEAM_PHOTOS[selected].location)}</span>
                {TEAM_PHOTOS[selected].members && TEAM_PHOTOS[selected].members!.length > 0 && (
                  <div className='plb-members'>
                    {TEAM_PHOTOS[selected].members!.map((m) => <span key={m} className='plb-tag'>{m.toUpperCase()}</span>)}
                  </div>
                )}
                {TEAM_PHOTOS[selected].note && (
                  <span className='plb-note'>{zh ? TEAM_PHOTOS[selected].note : (TEAM_PHOTOS[selected].note_en ?? TEAM_PHOTOS[selected].note)}</span>
                )}
              </div>
              <div className='plb-nav'>
                <button
                  className='plb-arrow'
                  onClick={(e) => { e.stopPropagation(); setSelected((selected - 1 + TEAM_PHOTOS.length) % TEAM_PHOTOS.length) }}
                >◀</button>
                <span className='plb-counter'>{selected + 1} / {TEAM_PHOTOS.length}</span>
                <button
                  className='plb-arrow'
                  onClick={(e) => { e.stopPropagation(); setSelected((selected + 1) % TEAM_PHOTOS.length) }}
                >▶</button>
              </div>
              <button className='plb-close' onClick={() => setSelected(null)}>✕</button>
            </div>
          </div>
        )}
      </div>
    </Scrim>
  )
}
