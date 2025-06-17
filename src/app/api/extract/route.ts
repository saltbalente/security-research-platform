import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

interface YtDlpFormat {
  url: string;
  filesize?: number;
  filesize_approx?: number;
  ext: string;
  format_id: string;
  resolution?: string;
  vcodec?: string;
  acodec?: string;
}

interface YtDlpOutput {
  id: string;
  title: string;
  thumbnail?: string;
  formats: YtDlpFormat[];
  url?: string;
  filesize?: number;
  filesize_approx?: number;
  ext?: string;
}

export async function POST(request: Request) {
  try {
    const { url: videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[ExtractorService] Received URL: ${videoUrl}`);

    // Para X/Twitter, priorizar formatos HTTP sobre HLS para obtener URLs directas MP4
    // http: URLs directas MP4, hls: archivos .m3u8 (streaming)
    const command = `yt-dlp -f "http/best" --dump-json --no-warnings "${videoUrl}"`;
    let ytDlpJsonString: string;

    try {
      const { stdout, stderr } = await execPromise(command);
      if (stderr) {
        console.warn(`[ExtractorService] yt-dlp stderr for ${videoUrl}:`, stderr);
      }
      ytDlpJsonString = stdout;
    } catch (execError: unknown) {
      console.error(`[ExtractorService] yt-dlp execution failed for ${videoUrl}:`, execError);
      const errorMessage = execError instanceof Error ? execError.message : 'Unknown error';
      return NextResponse.json({ error: `Failed to execute yt-dlp: ${errorMessage}` }, { status: 500 });
    }

    let ytDlpOutput: YtDlpOutput;
    try {
      ytDlpOutput = JSON.parse(ytDlpJsonString);
    } catch (parseError: unknown) {
      console.error(`[ExtractorService] Failed to parse yt-dlp JSON output for ${videoUrl}:`, parseError, "Raw output:", ytDlpJsonString);
      return NextResponse.json({ error: 'Failed to parse video information from yt-dlp' }, { status: 500 });
    }

    const title = ytDlpOutput.title || 'Untitled Video';
    const thumbnail = ytDlpOutput.thumbnail || '';
    let finalUrl = ytDlpOutput.url;
    const finalExt = ytDlpOutput.ext;
    let finalSize = ytDlpOutput.filesize || ytDlpOutput.filesize_approx || 0;

    // Prioritize top-level URL if it's MP4 (yt-dlp with -f should provide this)
    if (finalUrl && finalExt === 'mp4') {
      console.log(`[ExtractorService] Using top-level MP4 URL: ${finalUrl}`);
    } else {
      console.warn(`[ExtractorService] Top-level URL is not MP4 (ext: ${finalExt}) or missing. Searching formats array.`);
      const availableFormats = ytDlpOutput.formats || [];
      const mp4VideoFormats = availableFormats.filter(
        f => f.url && f.ext === 'mp4' && f.vcodec && f.vcodec !== 'none'
      );

      if (mp4VideoFormats.length > 0) {
        // Sort by resolution (height) descending, then by filesize descending as a tie-breaker
        mp4VideoFormats.sort((a, b) => {
          const resA = parseInt((a.resolution || "0x0").split('x')[1] || "0");
          const resB = parseInt((b.resolution || "0x0").split('x')[1] || "0");
          if (resB !== resA) return resB - resA;
          return (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0);
        });
        const bestMp4 = mp4VideoFormats[0];
        finalUrl = bestMp4.url;
        finalSize = bestMp4.filesize || bestMp4.filesize_approx || 0;
        console.log(`[ExtractorService] Selected MP4 from formats: ${finalUrl} (Resolution: ${bestMp4.resolution})`);
      } else {
        console.error(`[ExtractorService] No suitable MP4 format with a direct URL found in formats array for ${videoUrl}`);
        return NextResponse.json({ error: 'No direct MP4 video format found by yt-dlp' }, { status: 500 });
      }
    }

    if (!finalUrl) {
      // This case should ideally be caught by the logic above
      console.error(`[ExtractorService] finalUrl is unexpectedly empty after processing for ${videoUrl}`);
      return NextResponse.json({ error: 'Failed to determine final video URL' }, { status: 500 });
    }

    const responseData = {
      mp4Url: finalUrl,
      title,
      thumbnail,
      sizeApprox: finalSize,
    };

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    console.error('[ExtractorService] Unhandled error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to extract video information: ${errorMessage}` }, { status: 500 });
  }
}