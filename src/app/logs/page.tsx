"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component or will add one
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming Select component
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LucideListFilter, LucideSearch, LucideArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the structure of a log entry, matching the schema
interface AnalysisLog {
  id: number;
  originalUrl: string;
  finalUrl: string;
  timestamp: number;
  network: string;
  maxSeverity: 'Low' | 'Medium' | 'High' | 'None';
  findings: Record<string, unknown>; // Assuming findings is a JSON object/string
  title?: string;
  thumbnail?: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AnalysisLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'Low' | 'Medium' | 'High'>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/logs');
        if (!response.ok) {
          throw new Error(`Failed to fetch logs: ${response.status}`);
        }
        const data = await response.json();
        setLogs(data);
        setFilteredLogs(data); // Initialize filtered logs
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    let currentLogs = [...logs];
    if (searchTerm) {
      currentLogs = currentLogs.filter(
        (log) =>
          log.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.finalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.title && log.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (severityFilter !== 'all') {
      currentLogs = currentLogs.filter((log) => log.maxSeverity === severityFilter);
    }
    setFilteredLogs(currentLogs);
  }, [searchTerm, severityFilter, logs]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading logs...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Historial de Análisis</h1>
        <Button variant="outline" asChild>
          <Link href="/">
            <LucideArrowLeft className="mr-2 h-4 w-4" /> Volver al Analizador
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card">
        <div className="flex-grow relative">
          <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por URL o título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <LucideListFilter className="h-5 w-5 text-muted-foreground" />
          <Select value={severityFilter} onValueChange={(value: 'all' | 'Low' | 'Medium' | 'High') => setSeverityFilter(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por severidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Severidades</SelectItem>
              <SelectItem value="Low">Baja</SelectItem>
              <SelectItem value="Medium">Media</SelectItem>
              <SelectItem value="High">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredLogs.length === 0 && !isLoading && (
        <div className="text-center py-10 text-muted-foreground">
          <p>No se encontraron logs con los filtros actuales.</p>
          {logs.length > 0 && (
             <Button variant="link" onClick={() => { setSearchTerm(''); setSeverityFilter('all'); }}>Limpiar filtros</Button>
          )}
        </div>
      )}

      {filteredLogs.length > 0 && (
        <Table>
          <TableCaption>Un listado de los análisis de video recientes.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">URL Original</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Red</TableHead>
              <TableHead>Severidad Máx.</TableHead>
              <TableHead className="text-right">Fecha</TableHead>
              {/* <TableHead className="text-right">Acciones</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium truncate max-w-xs">
                  <a href={log.originalUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {log.originalUrl}
                  </a>
                </TableCell>
                <TableCell>{log.title || '-'}</TableCell>
                <TableCell>{log.network}</TableCell>
                <TableCell>
                  <Badge
                    variant={log.maxSeverity === 'High' ? 'destructive' : log.maxSeverity === 'Medium' ? 'secondary' : 'default'}
                    className={cn(
                        log.maxSeverity === 'High' && 'bg-red-500 text-white',
                        log.maxSeverity === 'Medium' && 'bg-yellow-500 text-black',
                        log.maxSeverity === 'Low' && 'bg-green-500 text-white',
                        log.maxSeverity === 'None' && 'bg-gray-500 text-white'
                    )}
                   >
                    {log.maxSeverity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {new Date(log.timestamp * 1000).toLocaleString()}
                </TableCell>
                {/* <TableCell className="text-right">
                  <Button variant="outline" size="sm">Ver Detalles</Button> 
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}