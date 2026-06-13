'use client'

import React, {useEffect, useRef, useState} from 'react'

import type {FloorThemeDef, Lang, TeamMember} from '@/types/team'
import {
    collides,
    type Dir,
    DIRS,
    FOOT_H,
    FRAME_COUNT,
    FRAME_MS,
    frameSrc,
    MEMBER_START,
    OFFICE_ITEMS,
    PUNCH_CLOCK,
    SPRITE_H,
    SPRITE_W,
    WALK_SPEED,
    WALL_Y,
    zOf,
} from '@/data/office'
import {HQ_I18N} from '@/data/i18n'

import {MemberSprite} from './member-sprite'

interface RoomProps {
    team: TeamMember[]
    onPick: (id: string) => void
    theme: FloorThemeDef
    lang: Lang
    onOpenLog: () => void
    onOpenTeamLog: () => void
    onOpenBacklog: () => void
    onOpenAlbum: () => void
    loggedToday: number
    bossNote?: string | null
}

const MOVE_KEYS = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd']

export function Room({team, onPick, theme, lang, onOpenLog, onOpenTeamLog, onOpenBacklog, onOpenAlbum, loggedToday}: RoomProps) {
    const t = HQ_I18N[lang]
    const roomRef = useRef<HTMLDivElement>(null)
    const containerRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const imgRefs = useRef<Record<string, HTMLImageElement | null>>({})
    const posRef = useRef<Record<string, { x: number; y: number }>>(
        Object.fromEntries(Object.entries(MEMBER_START).map(([id, p]) => [id, {...p}]))
    )
    const keysRef = useRef<Record<string, boolean>>({})
    const [selected, setSelected] = useState<string | null>(null)
    const selRef = useRef<string | null>(null)
    selRef.current = selected

    // preload walk frames once
    useEffect(() => {
        team.forEach((m) => {
            const frames = FRAME_COUNT[m.id] ?? 4
            DIRS.forEach((dir) => {
                for (let f = 0; f < frames; f++) {
                    const img = new Image()
                    img.src = frameSrc(m.id, dir, f)
                }
            })
        })
    }, [team])

    // keep DOM positions in sync after any re-render
    useEffect(() => {
        team.forEach((m) => {
            const el = containerRefs.current[m.id]
            const img = imgRefs.current[m.id]
            const p = posRef.current[m.id]
            if (el && p) {
                el.style.left = `${p.x}px`
                el.style.top = `${p.y}px`
                if (img) img.style.zIndex = String(zOf(p.y))
            }
        })
    })

    // keyboard state
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase()
            if (k === 'escape') {
                setSelected(null);
                return
            }
            if (!MOVE_KEYS.includes(k)) return
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return
            if (selRef.current) {
                keysRef.current[k] = true
                e.preventDefault()
            }
        }
        const up = (e: KeyboardEvent) => {
            keysRef.current[e.key.toLowerCase()] = false
        }
        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)
        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [])

    // movement loop for the selected member
    useEffect(() => {
        if (!selected) return
        const el = containerRefs.current[selected]
        const img = imgRefs.current[selected]
        const room = roomRef.current
        const p = posRef.current[selected]
        if (!el || !img || !room || !p) return

        const W = room.clientWidth
        const H = room.clientHeight
        const frames = FRAME_COUNT[selected] ?? 4
        const minY = WALL_Y - SPRITE_H + FOOT_H
        const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

        let raf = 0
        let last = performance.now()
        let acc = 0
        let frame = 0
        let dir: Dir = 'down'

        const step = (now: number) => {
            const dt = Math.min(now - last, 50)
            last = now
            let dx = 0
            let dy = 0
            const k = keysRef.current
            if (k['arrowup'] || k['w']) {
                dy -= 1;
                dir = 'up'
            }
            if (k['arrowdown'] || k['s']) {
                dy += 1;
                dir = 'down'
            }
            if (k['arrowleft'] || k['a']) {
                dx -= 1;
                dir = 'left'
            }
            if (k['arrowright'] || k['d']) {
                dx += 1;
                dir = 'right'
            }

            if (dx !== 0 || dy !== 0) {
                const n = Math.hypot(dx, dy)
                const dist = (WALK_SPEED * dt) / 1000
                // axis-separated so the sprite slides along obstacles
                const nx = clamp(p.x + (dx / n) * dist, 4, W - SPRITE_W - 4)
                if (!collides(nx, p.y)) p.x = nx
                const ny = clamp(p.y + (dy / n) * dist, minY, H - SPRITE_H - 8)
                if (!collides(p.x, ny)) p.y = ny
                acc += dt
                if (acc >= FRAME_MS) {
                    acc = 0;
                    frame = (frame + 1) % frames
                }
            } else {
                frame = 0
                acc = 0
            }

            img.src = frameSrc(selected, dir, frame)
            el.style.left = `${p.x}px`
            el.style.top = `${p.y}px`
            img.style.zIndex = String(zOf(p.y))
            raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [selected])

    const openSheet = (id: string) => {
        setSelected(null)
        onPick(id)
    }

    return (
        <div
            ref={roomRef}
            className='room'
            style={
                {
                    '--room-floor-a': theme.fa,
                    '--room-floor-b': theme.fb,
                    '--room-wall': theme.wall,
                } as React.CSSProperties
            }
            onClick={() => setSelected(null)}
        >
            <div className='wall'/>
            <div className='floor'/>
            <div className='rug' style={{left: '14%', top: '34%', right: '14%', bottom: '14%'}}/>
            <div className='baseboard'/>

            {/* EAGLE poster (branding) */}
            <div className='decor poster' style={{right: '12%', top: 26}}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src='/logo-square.svg' alt='Eagle AI'/>
                <span className='ptxt'>EAGLE</span>
            </div>

            {/* furniture（牆上時鐘可點 → 團隊期間 log；置物櫃可點 → backlog；相機可點 → 相簿） */}
            {OFFICE_ITEMS.map((it) => {
                const isWallClock = it.id === 'wall-clock'
                const isLocker = it.id === 'locker'
                const isCamera = it.id === 'polaroid-camera'
                const label = isWallClock ? 'log' : isLocker ? 'backlog' : isCamera ? 'album' : null
                const z = it.z ?? zOf(it.y + it.h - SPRITE_H)
                const open = isWallClock ? onOpenTeamLog : isLocker ? onOpenBacklog : isCamera ? onOpenAlbum : null
                return (
                    <React.Fragment key={it.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            className={`office-item${open ? ' clickable' : ''}`}
                            src={`/items/office_items/${it.img}.png`}
                            alt={it.img}
                            style={{left: it.x, top: it.y, width: it.w, height: it.h, zIndex: z}}
                            draggable={false}
                            onClick={open ? (e) => {
                                e.stopPropagation();
                                open()
                            } : undefined}
                            title={isWallClock ? t.teamLog : isLocker ? t.backlog : isCamera ? t.photoAlbum : undefined}
                        />
                        {label && (
                            <div className='item-lbl lbl-glow'
                                 style={{left: it.x, top: it.y + it.h + 2, width: it.w, zIndex: z}}>
                                {label}
                            </div>
                        )}
                    </React.Fragment>
                )
            })}

            {/* office cats */}
            <div className='cat cat-orange' style={{left: '9%', top: '60%', zIndex: 5}}>
                <div className='c'>
                    <span className='tail'/><span className='body'/>
                    <span className='leg l1'/><span className='leg l2'/>
                    <span className='head'/><span className='eye'/>
                </div>
            </div>
            {/* sleeps on the conference table */}
            <div className='cat cat-black sleep' style={{left: '82%', top: '65%', zIndex: 21}}>
                <div className='c'>
                    <span className='tail'/><span className='body'/>
                    <span className='head'/><span className='zz'>zz</span>
                </div>
            </div>
            <div className='cat cat-white walk' style={{left: '30%', top: '15%', zIndex: 4}}>
                <div className='c'>
                    <span className='tail'/><span className='body'/>
                    <span className='leg l1'/><span className='leg l2'/>
                    <span className='head'/><span className='eye'/>
                </div>
            </div>

            {/* punch clock / daily log */}
            <div
                className='decor pclock'
                style={{
                    left: PUNCH_CLOCK.x,
                    top: PUNCH_CLOCK.y,
                    position: 'absolute',
                    zIndex: zOf(PUNCH_CLOCK.y + PUNCH_CLOCK.h - SPRITE_H)
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenLog()
                }}
                role='button'
                tabIndex={0}
                title={t.logTitle}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src='/items/office_items/punch_clock.png' alt='punch clock'
                     style={{width: PUNCH_CLOCK.w, height: PUNCH_CLOCK.h}} draggable={false}/>
                <div className='pc-badge'>{loggedToday}/{team.length}</div>
                <div className='lbl lbl-glow'>{t.clock}</div>
            </div>

            {team.map((m) => (
                <MemberSprite
                    key={m.id}
                    m={m}
                    lang={lang}
                    selected={selected === m.id}
                    onSelect={() => setSelected(m.id)}
                    onOpen={() => openSheet(m.id)}
                    setContainerRef={(el) => {
                        containerRefs.current[m.id] = el
                    }}
                    setImgRef={(el) => {
                        imgRefs.current[m.id] = el
                    }}
                />
            ))}
        </div>
    )
}
