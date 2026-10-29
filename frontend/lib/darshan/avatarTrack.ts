/**
 * Fingertip match-move for the hero avatar loop (public/art/krishna-avatar.mp4).
 *
 * The Wan 2.2 animation lets the raised hand drift a few pixels. These are the
 * fingertip's offsets from frame 1, per source frame (81), as fractions of the
 * avatar image — tracked from the rendered frames and smoothed (5-frame mean).
 * Hero.tsx moves the chakra, its rings and the fingertip cut-out by them so the
 * disc never slips off the finger while the video plays.
 *
 * The loop file is ping-pong: source frames 0..80 then 79..1 (160 frames @24fps).
 */
export const AVATAR_LOOP = { fps: 24, frames: 160 }

export const FINGERTIP_DX: readonly number[] = [0.0, -0.00023, -0.00052, -0.00087, -0.00117, -0.00142, -0.00163, -0.00178, -0.00184, -0.00185, -0.00179, -0.00163, -0.0014, -0.00105, -0.00062, -0.00013, 0.00041, 0.00098, 0.00152, 0.002, 0.00244, 0.00284, 0.00317, 0.00344, 0.00364, 0.00379, 0.00386, 0.00389, 0.00388, 0.00387, 0.00384, 0.00384, 0.00385, 0.00389, 0.00396, 0.00405, 0.00413, 0.00421, 0.00424, 0.00423, 0.00419, 0.00413, 0.00406, 0.00402, 0.00397, 0.00394, 0.00391, 0.00391, 0.00391, 0.00395, 0.00399, 0.00403, 0.00407, 0.00409, 0.0041, 0.0041, 0.00409, 0.00409, 0.00411, 0.00413, 0.00417, 0.00422, 0.00427, 0.00433, 0.00438, 0.00441, 0.0044, 0.00433, 0.00422, 0.00408, 0.00395, 0.0038, 0.00366, 0.00355, 0.00341, 0.00329, 0.00316, 0.00307, 0.003, 0.00295, 0.00293]

export const FINGERTIP_DY: readonly number[] = [0.0, 0.00022, 0.00049, 0.00075, 0.00085, 0.00114, 0.0014, 0.00167, 0.00192, 0.00213, 0.00215, 0.00217, 0.00214, 0.00211, 0.00208, 0.00186, 0.00161, 0.00137, 0.00111, 0.00082, 0.00074, 0.00068, 0.00064, 0.00061, 0.0006, 0.0006, 0.0006, 0.00063, 0.00069, 0.00078, 0.00088, 0.00112, 0.00136, 0.0016, 0.00183, 0.00206, 0.00213, 0.00221, 0.00226, 0.00249, 0.00269, 0.00292, 0.00311, 0.00331, 0.00333, 0.00336, 0.00336, 0.00337, 0.00344, 0.00369, 0.00396, 0.00425, 0.00457, 0.00485, 0.00496, 0.00506, 0.00512, 0.00533, 0.00553, 0.00571, 0.0059, 0.00611, 0.00618, 0.00624, 0.00631, 0.00636, 0.00637, 0.00639, 0.0064, 0.00642, 0.00639, 0.0064, 0.00642, 0.00644, 0.00646, 0.00649, 0.00649, 0.00647, 0.00643, 0.0064, 0.00637]

/** Source frame for a loop frame (undoes the ping-pong). */
export function sourceFrame(loopFrame: number): number {
  const f = ((loopFrame % AVATAR_LOOP.frames) + AVATAR_LOOP.frames) % AVATAR_LOOP.frames
  return f <= 80 ? f : AVATAR_LOOP.frames - f
}
