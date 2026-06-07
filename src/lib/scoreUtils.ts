import { Peserta, Aspek } from '@/store/useDataStore';

export function calculateNilaiTahap(
  penilaianStr: Record<string, { scores: Record<string, number> }> | undefined,
  aspekList: Aspek[]
): number {
  if (!penilaianStr || Object.keys(penilaianStr).length === 0) return 0;
  
  // Calculate average if there are multiple juries
  const juriIds = Object.keys(penilaianStr);
  let totalAllJuri = 0;
  
  juriIds.forEach(juriId => {
    const scores = penilaianStr[juriId].scores;
    let juriScore = 0;
    aspekList.forEach(aspek => {
      // Periksa apakah ini format lama (skor berdasarkan aspek.id skala 0-100)
      // Jika ya, gunakan. Jika tidak, hitung dari indikator (skala 1-5)
      if (scores[aspek.id] !== undefined && Object.keys(scores).includes(aspek.id)) {
         juriScore += (scores[aspek.id] * (aspek.bobot / 100));
      } else {
         const numIndikator = aspek.indikator.length;
         if (numIndikator > 0) {
            let sumIndikator = 0;
            aspek.indikator.forEach(ind => {
               // skor tiap indikator adalah dari 1-5
               sumIndikator += (scores[ind.id] || 0); 
            });
            const maxIndikatorScore = numIndikator * 5;
            const aspectScore100 = (sumIndikator / maxIndikatorScore) * 100;
            juriScore += (aspectScore100 * (aspek.bobot / 100));
         }
      }
    });
    totalAllJuri += juriScore;
  });
  
  return totalAllJuri / juriIds.length;
}

export function calculateNilaiAkhir(peserta: Peserta, aspekMedia: Aspek[], aspekPresentasi: Aspek[]): number {
  const nilaiMedia = calculateNilaiTahap(peserta.penilaianMedia, aspekMedia);
  const nilaiPresentasi = calculateNilaiTahap(peserta.penilaianPresentasi, aspekPresentasi);
  
  // Tahap 1: 60%, Tahap 2: 40%
  if (nilaiMedia > 0 && nilaiPresentasi === 0) {
     return nilaiMedia * 0.6; // If presentasi not yet done
  }
  return (nilaiMedia * 0.6) + (nilaiPresentasi * 0.4);
}

export function getStatus(peserta: Peserta): string {
  const hasMedia = Object.keys(peserta.penilaianMedia || {}).length > 0;
  const presentasiCount = Object.keys(peserta.penilaianPresentasi || {}).length;
  
  if (hasMedia && presentasiCount >= 3) return "Selesai (Dinilai Penuh)";
  if (hasMedia && presentasiCount > 0) return "Sebagian Presentasi";
  if (hasMedia) return "Dinilai Media";
  return "Belum Dinilai";
}
