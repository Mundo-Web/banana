<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Comando para limpiar progreso de auto-guardado antiguo
 */
class CleanupOldAutoSaves extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'autosave:cleanup 
                            {--days=30 : Días de antigüedad para considerar como antiguo}
                            {--dry-run : Solo mostrar qué se eliminaría sin hacer cambios}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpia progreso de auto-guardado antiguo para liberar espacio';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        return;
        $days = $this->option('days');
        $dryRun = $this->option('dry-run');
        $cutoffDate = Carbon::now()->subDays($days);

        $this->info("🧹 Iniciando limpieza de auto-guardados antiguos...");
        $this->info("📅 Eliminando registros anteriores a: {$cutoffDate->format('Y-m-d H:i:s')}");

        if ($dryRun) {
            $this->warn("🔍 MODO DRY-RUN: Solo mostrando qué se eliminaría");
        }

        // Encontrar proyectos con auto-guardados antiguos
        $oldProjects = DB::table('canvas_projects')
            ->where('is_autosave', true)
            ->where('progress_saved_at', '<', $cutoffDate)
            ->whereNotNull('progress_saved_at')
            ->get(['id', 'progress_saved_at', 'manually_saved_at']);

        if ($oldProjects->isEmpty()) {
            $this->info("✅ No se encontraron auto-guardados antiguos para limpiar");
            return 0;
        }

        $this->info("📊 Encontrados {$oldProjects->count()} proyectos con auto-guardados antiguos");

        // Mostrar tabla con información
        $tableData = $oldProjects->map(function ($project) {
            return [
                'ID' => $project->id,
                'Auto-guardado' => $project->progress_saved_at,
                'Guardado manual' => $project->manually_saved_at ?? 'Nunca',
                'Acción' => $project->manually_saved_at ? 'Limpiar auto-save' : 'Eliminar proyecto'
            ];
        })->toArray();

        $this->table(['ID', 'Auto-guardado', 'Guardado manual', 'Acción'], $tableData);

        if (!$dryRun) {
            if (!$this->confirm('¿Proceder con la limpieza?')) {
                $this->info("❌ Operación cancelada");
                return 0;
            }
        }

        $cleaned = 0;
        $deleted = 0;

        foreach ($oldProjects as $project) {
            if ($dryRun) {
                if ($project->manually_saved_at) {
                    $this->line("🧹 [DRY-RUN] Limpiaría auto-save del proyecto {$project->id}");
                } else {
                    $this->line("🗑️ [DRY-RUN] Eliminaría proyecto {$project->id} (sin guardado manual)");
                }
                continue;
            }

            try {
                if ($project->manually_saved_at) {
                    // Si hay guardado manual, solo limpiar el auto-save
                    DB::table('canvas_projects')
                        ->where('id', $project->id)
                        ->update([
                            'is_autosave' => false,
                            'progress_saved_at' => null
                        ]);
                    
                    $this->line("🧹 Limpiado auto-save del proyecto {$project->id}");
                    $cleaned++;
                } else {
                    // Si no hay guardado manual, eliminar el proyecto completo
                    DB::table('canvas_projects')->where('id', $project->id)->delete();
                    
                    $this->line("🗑️ Eliminado proyecto {$project->id} (sin guardado manual)");
                    $deleted++;
                }
            } catch (\Exception $e) {
                $this->error("❌ Error procesando proyecto {$project->id}: {$e->getMessage()}");
            }
        }

        if (!$dryRun) {
            $this->info("✅ Limpieza completada:");
            $this->info("   - Auto-saves limpiados: {$cleaned}");
            $this->info("   - Proyectos eliminados: {$deleted}");
            $this->info("   - Total procesados: " . ($cleaned + $deleted));
        }

        // Estadísticas adicionales
        $this->info("\n📊 Estadísticas actuales:");
        
        $totalProjects = DB::table('canvas_projects')->count();
        $autoSaveProjects = DB::table('canvas_projects')->where('is_autosave', true)->count();
        $finalizedProjects = DB::table('canvas_projects')->where('is_finalized', true)->count();
        
        $this->info("   - Total de proyectos: {$totalProjects}");
        $this->info("   - Con auto-save activo: {$autoSaveProjects}");
        $this->info("   - Finalizados: {$finalizedProjects}");

        return 0;
    }
}
