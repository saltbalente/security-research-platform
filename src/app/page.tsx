"use client"; // Required for useState, useEffect, and event handlers

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,  
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { LucideVideotape, LucideShieldAlert, LucideCopy, LucideLoader2 } from 'lucide-react'; // Icons
import { cn } from "@/lib/utils"; // Already imported in layout, but good practice if used here directly for cn

// Define interfaces for the data structures
interface Vulnerability {
  id: string;
  issue: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
}

interface VideoVariant {
  url: string;
  quality: string;
  resolution?: string;
  bitrate?: number;
  contentType: string;
  fileSize?: number;
}

interface AnalysisResult {
  mp4Url: string; // Mantener para compatibilidad
  title?: string;
  thumbnail?: string;
  sizeApprox?: number;
  vulnerabilities: Vulnerability[];
  // Nuevos campos
  variants?: VideoVariant[];
  author?: string;
  duration?: number;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLegalModal, setShowLegalModal] = useState(true);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const handleAnalyze = async () => {
    if (!acceptedLegal) {
      setError("Please accept the terms to continue.");
      return;
    }
    if (!url) {
      setError("Please enter a URL.");
      return;
    }
    // Basic URL validation (you might want a more robust one)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setError("Please enter a valid URL (starting with http:// or https://).");
        return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Step 1: Call ExtractorService API
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || `Extractor failed with status: ${extractResponse.status}`);
      }

      const extractedData = await extractResponse.json();
      
      // Step 2: Call VulnerabilityScanner (client-side for now, could be an API too)
      // For a real app, sensitive scanning might be better on the backend.
      // However, some checks like CORS *must* be from client or a proxy that mimics client.
      const { scanUrlForVulnerabilities } = await import('@/lib/vulnerability-scanner');
      const vulnerabilities = await scanUrlForVulnerabilities({ finalUrl: extractedData.mp4Url });

      setAnalysisResult({
        mp4Url: extractedData.mp4Url,
        title: extractedData.title,
        thumbnail: extractedData.thumbnail,
        sizeApprox: extractedData.sizeApprox,
        vulnerabilities,
        // Nuevos campos
        variants: extractedData.variants,
        author: extractedData.author,
        duration: extractedData.duration,
      });

      // Step 3: Save to logs
      try {
        const network = url.includes('instagram.com') ? 'instagram' : url.includes('x.com') || url.includes('twitter.com') ? 'x' : 'unknown';
        let maxSeverity: 'Low' | 'Medium' | 'High' | 'None' = 'None';
        if (vulnerabilities.length > 0) {
          const severities = vulnerabilities.map(v => v.severity);
          if (severities.includes('High')) maxSeverity = 'High';
          else if (severities.includes('Medium')) maxSeverity = 'Medium';
          else if (severities.includes('Low')) maxSeverity = 'Low';
        }

        await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalUrl: url,
            finalUrl: extractedData.mp4Url,
            title: extractedData.title,
            thumbnail: extractedData.thumbnail,
            sizeApprox: extractedData.sizeApprox,
            network,
            maxSeverity,
            findings: vulnerabilities, // Send the array of vulnerability objects
          }),
        });
        // console.log('Log saved successfully');
      } catch (logError: unknown) {
        console.error("Failed to save log:", logError);
        // Optionally notify user that logging failed, but analysis was successful
      }

    } catch (err: unknown) {
      console.error("Analysis failed:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
    }
    setIsLoading(false);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Show a toast or notification for successful copy
      console.log('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };
  
  // Show legal modal on first load if not accepted
  useEffect(() => {
    const legalAccepted = localStorage.getItem('legalAccepted');
    if (legalAccepted === 'true') {
      setAcceptedLegal(true);
      setShowLegalModal(false);
    }
  }, []);

  const handleAcceptLegal = () => {
    localStorage.setItem('legalAccepted', 'true');
    setAcceptedLegal(true);
    setShowLegalModal(false);
    setError(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12">
      <Dialog open={showLegalModal && !acceptedLegal} onOpenChange={(open) => !open && acceptedLegal && setShowLegalModal(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Uso Educativo y Responsable</DialogTitle>
            <DialogDescription className="py-2">
              Esta herramienta es un prototipo educativo para investigación en seguridad. 
              Úsela de forma responsable y solo con contenido para el cual tenga permiso de análisis.
              No la utilice para infringir derechos de autor o realizar actividades ilegales.
            </DialogDescription>
          </DialogHeader>
          <div className="items-top flex space-x-2 py-2">
            <Checkbox id="terms1" onCheckedChange={(checked) => setAcceptedLegal(!!checked)} checked={acceptedLegal} />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms1"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                He leído y acepto los términos de uso educativo.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAcceptLegal} disabled={!acceptedLegal}>Aceptar y Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full max-w-2xl space-y-8">
        <header className="text-center space-y-2">
          <LucideVideotape className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Security Research Platform
          </h1>
          <p className="text-muted-foreground">
            Analiza URLs de video de Instagram y X para identificar posibles vulnerabilidades.
          </p>
        </header>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Analizar Video</CardTitle>
            <CardDescription>Pega la URL de un post con video (Instagram o X).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="video-url">URL del Video</Label>
              <Input 
                id="video-url" 
                placeholder="https://www.instagram.com/p/Cxyz... o https://x.com/user/status/123..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading || !acceptedLegal}
              />
            </div>
            {error && <p className="text-sm text-red-500 pt-2">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnalyze} disabled={isLoading || !acceptedLegal} className="w-full">
              {isLoading ? (
                <><LucideLoader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando...</>
              ) : (
                'Analizar'
              )}
            </Button>
          </CardFooter>
        </Card>

        {analysisResult && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{analysisResult.title || 'Video Preview'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative rounded-md aspect-video bg-gray-100 overflow-hidden">
                {analysisResult.thumbnail ? (
                  <Image 
                    src={analysisResult.thumbnail} 
                    alt={analysisResult.title || 'Video thumbnail'} 
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.placeholder-content')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'placeholder-content flex items-center justify-center w-full h-full bg-gray-200 text-gray-500';
                        placeholder.innerHTML = '<div class="text-center"><svg class="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><p class="text-sm">Miniatura no disponible</p></div>';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Miniatura no disponible</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="aspect-video bg-muted rounded-md overflow-hidden">
                <video controls src={analysisResult.mp4Url} className="w-full h-full" />
              </div>
              
              {/* Sección de Descargas - Similar a XvideoDownloader.net */}
              {analysisResult.variants && analysisResult.variants.length > 0 && (
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideVideotape className="mr-2 h-5 w-5" />
                      Opciones de Descarga
                    </CardTitle>
                    <CardDescription>
                      Selecciona la calidad de video que deseas descargar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.variants.map((variant, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {variant.quality} {variant.resolution && `(${variant.resolution})`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {variant.contentType}
                                {variant.bitrate && ` • ${Math.round(variant.bitrate / 1000)}kbps`}
                                {variant.fileSize && ` • ${(variant.fileSize / 1024 / 1024).toFixed(1)}MB`}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(variant.url, '_blank')}
                            >
                              Reproducir
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = variant.url;
                                link.download = `video-${variant.quality}-${Date.now()}.mp4`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              Descargar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>URL Final del Video</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center space-x-2">
                      <Input value={analysisResult.mp4Url} readOnly className="flex-grow" />
                      <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(analysisResult.mp4Url)}>
                        <LucideCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="flex items-center">
                    <LucideShieldAlert className="mr-2 h-5 w-5 text-yellow-500" /> Vulnerabilidades Encontradas
                  </AccordionTrigger>
                  <AccordionContent>
                    {analysisResult.vulnerabilities.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Problema</TableHead>
                            <TableHead>Severidad</TableHead>
                            <TableHead className="text-right">Descripción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysisResult.vulnerabilities.map((vuln) => (
                            <TableRow key={vuln.id}>
                              <TableCell className="font-medium">{vuln.issue}</TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                                    vuln.severity === 'High' && 'bg-red-500 text-white',
                                    vuln.severity === 'Medium' && 'bg-yellow-500 text-black',
                                    vuln.severity === 'Low' && 'bg-green-500 text-white'
                                  )}
                                >
                                  {vuln.severity}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">{vuln.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se encontraron vulnerabilidades significativas.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
