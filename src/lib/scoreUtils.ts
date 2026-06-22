import { Peserta, Aspek } from '@/store/useDataStore';

/**
 * Calculates the score for a specific Aspect ID based on jury entries.
 * Returns a value from 0 to 100 based on indicators.
 */
export function calculateAspectScore(
  penilaian: Record<string, { scores: Record<string, number> }> | undefined,
  aspek: Aspek
): number {
  if (!penilaian || Object.keys(penilaian).length === 0) return 0;

  const juriIds = Object.keys(penilaian);
  let totalJuriScore = 0;
  let juriCountForAspect = 0;

  juriIds.forEach(juriId => {
    const scores = penilaian[juriId].scores;
    const numIndikator = aspek.indikator.length;
    
    // Check if the jury rated this aspect's indicators
    let hasRating = false;
    let sumIndikator = 0;
    
    if (numIndikator > 0) {
      aspek.indikator.forEach(ind => {
        if (scores[ind.id] !== undefined && scores[ind.id] > 0) {
          sumIndikator += scores[ind.id];
          hasRating = true;
        }
      });
    }

    if (hasRating) {
      const maxScore = numIndikator * 5;
      const score100 = (sumIndikator / maxScore) * 100;
      totalJuriScore += score100;
      juriCountForAspect++;
    }
  });

  return juriCountForAspect > 0 ? totalJuriScore / juriCountForAspect : 0;
}

/**
 * Calculates the aspect score (0-100) for a specific jury.
 * Returns 0 if that jury hasn't graded this aspect.
 */
export function calculateAspectScoreForJuri(
  penilaian: Record<string, { scores: Record<string, number> }> | undefined,
  aspek: Aspek,
  juriUsername: string
): number {
  if (!penilaian || !penilaian[juriUsername]) return 0;

  const scores = penilaian[juriUsername].scores;
  const numIndikator = aspek.indikator.length;
  
  let hasRating = false;
  let sumIndikator = 0;
  
  if (numIndikator > 0) {
    aspek.indikator.forEach(ind => {
      if (scores[ind.id] !== undefined && scores[ind.id] > 0) {
        sumIndikator += scores[ind.id];
        hasRating = true;
      }
    });
  }

  if (hasRating) {
    const maxScore = numIndikator * 5;
    return (sumIndikator / maxScore) * 100;
  }
  
  return 0;
}

/**
 * Calculates the overall score for a category like Media or Presentasi
 * by weighting the average score of each aspect inside the category list.
 */
export function calculateCategoryScore(
  penilaian: Record<string, { scores: Record<string, number> }> | undefined,
  aspekList: Aspek[]
): number {
  if (!penilaian || Object.keys(penilaian).length === 0 || aspekList.length === 0) return 0;
  
  let totalWeighted = 0;
  let totalBobotGraded = 0;
  
  aspekList.forEach(aspek => {
    const aspectScore = calculateAspectScore(penilaian, aspek);
    if (aspectScore > 0) {
      totalWeighted += aspectScore * (aspek.bobot / 100);
      totalBobotGraded += aspek.bobot;
    }
  });
  
  // Normalize if not all aspects are graded yet, but if they are graded we return the weighted sum.
  // To keep it standard, we can return the cumulative total weighted score directly,
  // or return the weighted average based on graded aspects. Let's return the exact weighted sum.
  return totalWeighted;
}

// Backwards compatibility mapper
export function calculateNilaiTahap(
  penilaian: Record<string, { scores: Record<string, number> }> | undefined,
  aspekList: Aspek[]
): number {
  return calculateCategoryScore(penilaian, aspekList);
}

/**
 * Calculates the final unified score combining both Phase 1 (Media, 60%) and Phase 2 (Presentasi, 40%).
 */
export function calculateNilaiAkhir(peserta: Peserta, aspekMedia: Aspek[], aspekPresentasi: Aspek[]): number {
  const nilaiMedia = calculateCategoryScore(peserta.penilaianMedia, aspekMedia);
  const nilaiPresentasi = calculateCategoryScore(peserta.penilaianPresentasi, aspekPresentasi);
  
  if (nilaiMedia > 0 && nilaiPresentasi === 0) {
    return nilaiMedia * 0.6;
  }
  if (nilaiMedia === 0 && nilaiPresentasi > 0) {
    return nilaiPresentasi * 0.4;
  }
  return (nilaiMedia * 0.6) + (nilaiPresentasi * 0.4);
}

/**
 * Returns a simple single-stage progress status.
 */
export function getStatus(peserta: Peserta): string {
  const hasMedia = Object.keys(peserta.penilaianMedia || {}).length > 0;
  const hasPresentasi = Object.keys(peserta.penilaianPresentasi || {}).length > 0;
  
  if (hasMedia && hasPresentasi) return "Selesai Dinilai";
  if (hasMedia || hasPresentasi) return "Sebagian Dinilai";
  return "Belum Dinilai";
}
