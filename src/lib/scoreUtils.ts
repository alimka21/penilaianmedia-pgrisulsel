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
 * Calculates the overall category score (0-100) for a specific jury.
 */
export function calculateCategoryScoreForJuri(
  penilaian: Record<string, { scores: Record<string, number> }> | undefined,
  aspekList: Aspek[],
  juriUsername: string
): number {
  if (!penilaian || !penilaian[juriUsername] || aspekList.length === 0) return 0;
  
  let totalWeighted = 0;
  aspekList.forEach(aspek => {
    const aspectScore = calculateAspectScoreForJuri(penilaian, aspek, juriUsername);
    totalWeighted += aspectScore * (aspek.bobot / 100);
  });
  
  return totalWeighted;
}

/**
 * Calculates the overall score for a category like Media or Presentasi
 * by averaging the total scores submitted by each active jury (adaptive division).
 */
export function calculateCategoryScore(
  penilaian: Record<string, { scores: Record<string, number> }> | undefined,
  aspekList: Aspek[]
): number {
  if (!penilaian || Object.keys(penilaian).length === 0 || aspekList.length === 0) return 0;
  
  const juriIds = Object.keys(penilaian);
  let totalJuriesScore = 0;
  let activeJuriCount = 0;
  
  juriIds.forEach(juriId => {
    const juriScore = calculateCategoryScoreForJuri(penilaian, aspekList, juriId);
    if (juriScore > 0) {
      totalJuriesScore += juriScore;
      activeJuriCount++;
    }
  });
  
  return activeJuriCount > 0 ? totalJuriesScore / activeJuriCount : 0;
}

// Backwards compatibility mapper
export function calculateNilaiTahap(
  penilaian: Record<string, { scores: Record<string, number> }> | undefined,
  aspekList: Aspek[]
): number {
  return calculateCategoryScore(penilaian, aspekList);
}

/**
 * Calculates the final unified score combining both Phase 1 (Media) and Phase 2 (Presentasi) with dynamic weights.
 */
export function calculateNilaiAkhir(
  peserta: Peserta, 
  aspekMedia: Aspek[], 
  aspekPresentasi: Aspek[],
  bobotMedia: number = 60,
  bobotPresentasi: number = 40
): number {
  const nilaiMedia = calculateCategoryScore(peserta.penilaianMedia, aspekMedia);
  const nilaiPresentasi = calculateCategoryScore(peserta.penilaianPresentasi, aspekPresentasi);
  
  const factorMedia = bobotMedia / 100;
  const factorPresentasi = bobotPresentasi / 100;
  
  if (nilaiMedia > 0 && nilaiPresentasi === 0) {
    return nilaiMedia * factorMedia;
  }
  if (nilaiMedia === 0 && nilaiPresentasi > 0) {
    return nilaiPresentasi * factorPresentasi;
  }
  return (nilaiMedia * factorMedia) + (nilaiPresentasi * factorPresentasi);
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
