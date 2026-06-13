export interface OfficeItemDef {
    id: string
    img: string
    x: number
    y: number
    w: number
    h: number
    solid?: boolean
    z?: number
}

/* display sizes are natural png size × 2 (same as demo) */
export const OFFICE_ITEMS: OfficeItemDef[] = [
    // wall
    {id: 'window-a', img: 'window', x: 40, y: 22, w: 106, h: 84},
    {id: 'whiteboard', img: 'whiteboard', x: 300, y: 20, w: 130, h: 84},
    {id: 'wall-clock', img: 'wall_clock', x: 520, y: 20, w: 42, h: 42},
    {id: 'map', img: 'world_map', x: 640, y: 22, w: 135, h: 80},

    // desks + chairs (one per member)
    {id: 'desk-wesley', img: 'mac_code_desk', x: 150, y: 160, w: 130, h: 108, solid: true},
    {id: 'chair-wesley', img: 'chair_black', x: 165, y: 245, w: 50, h: 82, solid: true},
    {id: 'desk-margaret', img: 'mac_code_desk', x: 430, y: 160, w: 130, h: 108, solid: true},
    {id: 'chair-margaret', img: 'chair_black', x: 445, y: 245, w: 50, h: 82, solid: true},
    {id: 'desk-lee', img: 'multi_monitor_desk', x: 670, y: 160, w: 130, h: 108, solid: true},
    {id: 'chair-lee', img: 'chair_black', x: 685, y: 245, w: 50, h: 82, solid: true},
    {id: 'desk-jared', img: 'mac_code_desk', x: 240, y: 415, w: 130, h: 108, solid: true},
    {id: 'chair-jared', img: 'chair_black', x: 255, y: 500, w: 50, h: 82, solid: true},
    {id: 'desk-duck', img: 'multi_monitor_desk', x: 520, y: 415, w: 130, h: 108, solid: true},
    {id: 'chair-duck', img: 'chair_black_puppy', x: 490, y: 490, w: 120, h: 100, solid: true},

    // floor furniture
    {id: 'plant-large', img: 'plant_large', x: 0, y: 60, w: 68, h: 100, solid: true},
    {id: 'trash-can', img: 'trash_can', x: 390, y: 180, w: 40, h: 54, solid: true},
    {id: 'bookshelf', img: 'bookshelf', x: 180, y: 40, w: 86, h: 106, solid: true},
    {id: 'server-rack', img: 'server_rack', x: 900, y: 40, w: 68, h: 110, solid: true},
    {id: 'photocopier', img: 'photocopier', x: 865, y: 220, w: 100, h: 98, solid: true},
    {id: 'locker', img: 'locker_orange', x: 16, y: 550, w: 184, h: 104, solid: true},
    {id: 'plant-small', img: 'plant_small', x: 850, y: 90, w: 38, h: 48, solid: true},
    {id: 'recycle-bin', img: 'recycle_bin', x: 900, y: 325, w: 44, h: 60, solid: true},
    {id: 'conference-table', img: 'conference_table', x: 740, y: 440, w: 214, h: 110, solid: true},
    {id: 'water-dispenser', img: 'water_dispenser', x: 580, y: 40, w: 60, h: 106, solid: true},
    {id: 'coffee-machine', img: 'coffee_machine', x: 30, y: 460, w: 96, h: 72, solid: true},
    {id: 'polaroid-camera', img: 'polaroid_camera', x: 870, y: 455, w: 45, h: 45, solid: true, z: 21},
]

export const PUNCH_CLOCK: OfficeItemDef = {
    id: 'punch-clock', img: 'punch_clock', x: 860, y: 575, w: 52, h: 62, solid: true,
}

/* character sprites: 48×64 frames shown at 1.5x */
export const SPRITE_W = 72
export const SPRITE_H = 96
/* collision box = feet area at the bottom-center of the sprite */
export const FOOT_W = 36
export const FOOT_H = 18
/* feet may not go above this line (bottom of the wall) */
export const WALL_Y = 140

export const WALK_SPEED = 150 // px / s
export const FRAME_MS = 130

export const FRAME_COUNT: Record<string, number> = {
    duck: 5, jared: 4, lee: 4, margaret: 4, wesley: 4,
}

/* each member starts standing just right of their own chair */
export const MEMBER_START: Record<string, { x: number; y: number }> = {
    wesley: {x: 80, y: 192},
    margaret: {x: 540, y: 200},
    lee: {x: 780, y: 200},
    jared: {x: 340, y: 470},
    duck: {x: 640, y: 470},
}

export type Dir = 'up' | 'down' | 'left' | 'right'
export const DIRS: Dir[] = ['up', 'down', 'left', 'right']

export const frameSrc = (id: string, dir: Dir, frame: number) =>
    `/items/${id}_frames/${id}_${dir}_${frame}.png`

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number
}

/* solid footprint of an item = bottom half of its image */
const SOLID_RECTS: Rect[] = [...OFFICE_ITEMS, PUNCH_CLOCK]
    .filter((i) => i.solid)
    .map((i) => ({x: i.x, y: i.y + i.h / 2, w: i.w, h: i.h / 2}))

export function collides(spriteX: number, spriteY: number): boolean {
    const fx = spriteX + (SPRITE_W - FOOT_W) / 2
    const fy = spriteY + SPRITE_H - FOOT_H
    return SOLID_RECTS.some(
        (r) => fx < r.x + r.w && fx + FOOT_W > r.x && fy < r.y + r.h && fy + FOOT_H > r.y
    )
}

export const zOf = (spriteY: number) => Math.round((spriteY + SPRITE_H) / 30) + 2
