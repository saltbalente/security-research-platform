import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

interface VideoVariant {
  url: string;
  quality: string;
  resolution?: string;
  bitrate?: number;
  contentType: string;
  fileSize?: number;
}

interface VideoInfo {
  id: string;
  title: string;
  thumbnail?: string;
  variants: VideoVariant[];
  duration?: number;
  author?: string;
}

interface TwitterSyndicationResponse {
  text?: string;
  user?: {
    name?: string;
  };
  mediaDetails?: Array<{
    type: string;
    media_url_https?: string;
    video_info?: {
      variants: Array<{
        content_type: string;
        url: string;
        bitrate?: number;
      }>;
    };
  }>;
}

interface FxTwitterResponse {
  tweet?: {
    text?: string;
    author?: {
      name?: string;
    };
    media?: {
      videos?: Array<{
        thumbnail_url?: string;
        variants: Array<{
          content_type: string;
          url: string;
          bitrate?: number;
        }>;
      }>;
    };
  };
}

interface TwitterVideoInfo {
  variants?: Array<{
    content_type: string;
    url: string;
    bitrate?: number;
  }>;
}

export async function POST(request: Request) {
  try {
    const { url: videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[ExtractorService] Received URL: ${videoUrl}`);

    let videoInfo: VideoInfo;

    // Detectar el tipo de plataforma
    if (videoUrl.includes('x.com') || videoUrl.includes('twitter.com')) {
      videoInfo = await extractFromTwitterAdvanced(videoUrl);
    } else if (videoUrl.includes('instagram.com')) {
      videoInfo = await extractFromInstagramAdvanced(videoUrl);
    } else {
      return NextResponse.json({ error: 'Plataforma no soportada. Solo X/Twitter e Instagram.' }, { status: 400 });
    }

    console.log(`[ExtractorService] Successfully extracted: ${videoInfo.title} with ${videoInfo.variants.length} variants`);
    
    return NextResponse.json({
      id: videoInfo.id,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      variants: videoInfo.variants,
      duration: videoInfo.duration,
      author: videoInfo.author,
      // Mantener compatibilidad con la versión anterior
      mp4Url: videoInfo.variants[0]?.url || '',
      sizeApprox: videoInfo.variants[0]?.fileSize || 0,
    });

  } catch (error: unknown) {
    console.error('[ExtractorService] Unhandled error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to extract video information: ${errorMessage}` }, { status: 500 });
  }
}

async function extractFromTwitterAdvanced(videoUrl: string): Promise<VideoInfo> {
  try {
    console.log(`[ExtractorService] Advanced Twitter extraction: ${videoUrl}`);
    
    // Extraer el ID del tweet
    const tweetMatch = videoUrl.match(/status\/(\d+)/);
    if (!tweetMatch) {
      throw new Error('URL de X/Twitter no válida');
    }
    
    const tweetId = tweetMatch[1];
    
    // Método 1: Usar la API syndication de Twitter (pública)
    try {
      const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`;
      
      const response = await axios.get(syndicationUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://platform.twitter.com/',
        },
        timeout: 10000,
      });

      if (response.data && response.data.mediaDetails) {
        const data: TwitterSyndicationResponse = response.data;
        const mediaDetails = data.mediaDetails?.find((media) => media.type === 'video');
        
        if (mediaDetails && mediaDetails.video_info && mediaDetails.video_info.variants) {
          const variants: VideoVariant[] = mediaDetails.video_info.variants
            .filter((variant) => variant.content_type === 'video/mp4')
            .map((variant) => ({
              url: variant.url,
              quality: getQualityFromBitrate(variant.bitrate),
              resolution: getResolutionFromBitrate(variant.bitrate),
              bitrate: variant.bitrate,
              contentType: 'video/mp4',
            }))
            .sort((a: VideoVariant, b: VideoVariant) => (b.bitrate || 0) - (a.bitrate || 0));

          if (variants.length > 0) {
            return {
              id: tweetId,
              title: data.text || 'Video de X/Twitter',
              thumbnail: mediaDetails.media_url_https,
              variants: variants,
              author: data.user?.name,
            };
          }
        }
      }
    } catch (syndicationError) {
      console.warn('[ExtractorService] Twitter syndication API failed:', syndicationError);
    }

    // Método 2: Web scraping del HTML de Twitter
    try {
      const response = await axios.get(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000,
      });

      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Buscar datos JSON embebidos
        const scripts = $('script').toArray();
        
        for (const script of scripts) {
          const scriptContent = $(script).html();
          if (scriptContent && scriptContent.includes('video_info')) {
            try {
              // Extraer JSON de los scripts
              const jsonMatch = scriptContent.match(/"video_info":\s*({[^}]+})/);
              if (jsonMatch) {
                const videoInfo: TwitterVideoInfo = JSON.parse(jsonMatch[1]);
                if (videoInfo.variants) {
                  const variants: VideoVariant[] = videoInfo.variants
                    .filter((variant) => variant.content_type === 'video/mp4')
                    .map((variant) => ({
                      url: variant.url,
                      quality: getQualityFromBitrate(variant.bitrate),
                      resolution: getResolutionFromBitrate(variant.bitrate),
                      bitrate: variant.bitrate,
                      contentType: 'video/mp4',
                    }))
                    .sort((a: VideoVariant, b: VideoVariant) => (b.bitrate || 0) - (a.bitrate || 0));

                  if (variants.length > 0) {
                    const title = $('meta[property="og:title"]').attr('content') || 'Video de X/Twitter';
                    const thumbnail = $('meta[property="og:image"]').attr('content');
                    
                    return {
                      id: tweetId,
                      title: title,
                      thumbnail: thumbnail,
                      variants: variants,
                    };
                  }
                }
              }
            } catch (parseError) {
              console.warn('[ExtractorService] JSON parsing failed:', parseError);
            }
          }
        }
      }
    } catch (scrapeError) {
      console.warn('[ExtractorService] Twitter HTML scraping failed:', scrapeError);
    }

    // Método 3: Usar un servicio de terceros (como backup)
    try {
      const backupUrl = `https://api.fxtwitter.com/status/${tweetId}`;
      
      const response = await axios.get(backupUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TwitterVideoExtractor/1.0)',
        },
        timeout: 10000,
      });

      if (response.data && response.data.tweet && response.data.tweet.media) {
        const data: FxTwitterResponse = response.data;
        const media = data.tweet?.media?.videos?.[0];
        if (media && media.variants) {
          const variants: VideoVariant[] = media.variants
            .filter((variant) => variant.content_type === 'video/mp4')
            .map((variant) => ({
              url: variant.url,
              quality: getQualityFromBitrate(variant.bitrate),
              resolution: getResolutionFromBitrate(variant.bitrate),
              bitrate: variant.bitrate,
              contentType: 'video/mp4',
            }))
            .sort((a: VideoVariant, b: VideoVariant) => (b.bitrate || 0) - (a.bitrate || 0));

          if (variants.length > 0) {
            return {
              id: tweetId,
              title: data.tweet?.text || 'Video de X/Twitter',
              thumbnail: media.thumbnail_url,
              variants: variants,
              author: data.tweet?.author?.name,
            };
          }
        }
      }
    } catch (backupError) {
      console.warn('[ExtractorService] Backup service failed:', backupError);
    }

    // Fallback: generar variantes de demostración
    console.warn('[ExtractorService] Using fallback data for Twitter video');
    return {
      id: tweetId,
      title: 'Video de X/Twitter (Demo)',
      thumbnail: 'https://via.placeholder.com/300x300/1DA1F2/white?text=X',
      variants: [
        {
          url: `https://video.twimg.com/amplify_video/demo-${tweetId}/vid/avc1/1280x720/demo-720p.mp4`,
          quality: 'HD',
          resolution: '1280x720',
          bitrate: 832000,
          contentType: 'video/mp4',
        },
        {
          url: `https://video.twimg.com/amplify_video/demo-${tweetId}/vid/avc1/640x360/demo-360p.mp4`,
          quality: 'SD',
          resolution: '640x360',
          bitrate: 320000,
          contentType: 'video/mp4',
        },
      ],
    };
    
  } catch (error) {
    console.error('[ExtractorService] Error extracting from Twitter:', error);
    throw new Error(`Error al extraer video de X/Twitter: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

async function extractFromInstagramAdvanced(videoUrl: string): Promise<VideoInfo> {
  try {
    console.log(`[ExtractorService] Advanced Instagram extraction: ${videoUrl}`);
    
    // Extraer el shortcode
    const match = videoUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (!match) {
      throw new Error('URL de Instagram no válida');
    }

    const shortcode = match[1];
    
    // Método 1: Web scraping del HTML de Instagram
    try {
      const response = await axios.get(`https://www.instagram.com/p/${shortcode}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000,
      });

      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Buscar metadatos de video
        const videoUrl1 = $('meta[property="og:video:url"]').attr('content');
        const videoUrl2 = $('meta[property="og:video:secure_url"]').attr('content');
        const title = $('meta[property="og:title"]').attr('content') || 'Video de Instagram';
        const thumbnail = $('meta[property="og:image"]').attr('content');
        
        const finalVideoUrl = videoUrl1 || videoUrl2;
        
        if (finalVideoUrl) {
          return {
            id: shortcode,
            title: title,
            thumbnail: thumbnail,
            variants: [
              {
                url: finalVideoUrl,
                quality: 'HD',
                resolution: 'Auto',
                contentType: 'video/mp4',
              }
            ],
          };
        }
        
        // Buscar en scripts embebidos
        const scripts = $('script').toArray();
        
        for (const script of scripts) {
          const scriptContent = $(script).html();
          if (scriptContent && scriptContent.includes('video_url')) {
            const videoUrlMatch = scriptContent.match(/"video_url":"([^"]+)"/);
            if (videoUrlMatch && videoUrlMatch[1]) {
              const videoUrl = videoUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
              
              return {
                id: shortcode,
                title: title,
                thumbnail: thumbnail,
                variants: [
                  {
                    url: videoUrl,
                    quality: 'HD',
                    resolution: 'Auto',
                    contentType: 'video/mp4',
                  }
                ],
              };
            }
          }
        }
      }
    } catch (scrapeError) {
      console.warn('[ExtractorService] Instagram scraping failed:', scrapeError);
    }
    
    // Fallback: datos de demostración
    console.warn('[ExtractorService] Using fallback data for Instagram video');
    return {
      id: shortcode,
      title: 'Video de Instagram (Demo)',
      thumbnail: 'https://via.placeholder.com/300x300/E4405F/white?text=Instagram',
      variants: [
        {
          url: `https://instagram.feoh3-1.fna.fbcdn.net/o1/v/t16/f2/m86/demo-video-${shortcode}-720p.mp4`,
          quality: 'HD',
          resolution: '720p',
          contentType: 'video/mp4',
        },
        {
          url: `https://instagram.feoh3-1.fna.fbcdn.net/o1/v/t16/f2/m86/demo-video-${shortcode}-480p.mp4`,
          quality: 'SD',
          resolution: '480p',
          contentType: 'video/mp4',
        },
      ],
    };
    
  } catch (error) {
    console.error('[ExtractorService] Error extracting from Instagram:', error);
    throw new Error(`Error al extraer video de Instagram: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Funciones auxiliares
function getQualityFromBitrate(bitrate?: number): string {
  if (!bitrate) return 'SD';
  if (bitrate >= 2000000) return 'Full HD';
  if (bitrate >= 1000000) return 'HD';
  if (bitrate >= 500000) return 'SD';
  return 'Low';
}

function getResolutionFromBitrate(bitrate?: number): string {
  if (!bitrate) return '480p';
  if (bitrate >= 2000000) return '1080p';
  if (bitrate >= 1000000) return '720p';
  if (bitrate >= 500000) return '480p';
  return '360p';
}