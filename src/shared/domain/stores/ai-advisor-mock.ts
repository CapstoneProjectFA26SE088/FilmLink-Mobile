import type { AiChatMessage, ScanQualityAnalysis } from '../types';

export function buildAiAdvisoryReply(prompt: string): AiChatMessage {
  const lower = prompt.toLowerCase();
  let reply =
    'Dựa trên Knowledge Base của FilmLink: Đối với phim màu C-41 (như Kodak Gold 200 hoặc Portra 400), bạn nên đo sáng ưu tiên vùng tối (+0.5 đến +1 EV) để giữ chi tiết mịn màng và tránh bệt hạt vùng shadow.';
  let recommendedLabId: string | undefined = 'LAB-01';

  if (lower.includes('đen trắng') || lower.includes('b&w') || lower.includes('hp5')) {
    reply =
      'Với phim Đen Trắng (Ilford HP5+ / Kodak Tri-X): Nếu bạn chụp thiếu sáng và muốn push lên ISO 1600, hãy ghi chú cho Lab dùng thuốc tráng bù tốc độ Ilford Microphen hoặc D-76 (1+1). Darkroom Sài Gòn và Mộc Film Lab đều hỗ trợ tráng lắc tay B&W.';
    recommendedLabId = 'LAB-02';
  } else if (lower.includes('ecn') || lower.includes('vision') || lower.includes('800t')) {
    reply =
      'Với phim điện ảnh (Kodak Vision3 500T / 250D): Cần chọn đúng quy trình ECN-2 có bước khử lớp chống lóa Remjet để không làm bẩn hóa chất. LLab Analog Hà Nội và Mộc Film Lab có dây chuyền ECN-2 chuyên dụng.';
    recommendedLabId = 'LAB-03';
  } else if (lower.includes('lộ sáng') || lower.includes('xước') || lower.includes('bụi')) {
    reply =
      'Vệt sáng cam/đỏ chạy dọc mép phim thường do lão hóa mút chắn sáng bản lề nắp lưng (Light Seal). Nếu vệt trắng chạy ngang chỉ trong khung hình, có thể do rèm màn trập đóng chậm. Bạn có thể gửi yêu cầu Rescan (BR-27) nếu nghi ngờ lỗi do bụi mặt kính scanner.';
  }

  return {
    id: `AI-${Date.now()}`,
    sender: 'AI',
    text: reply,
    timestamp: new Date().toISOString(),
    recommendedLabId,
  };
}

export function analyzeFilmScanQuality(frameNumber: number): ScanQualityAnalysis {
  return {
    overallScore: 95,
    exposureAssessment: `Frame #${frameNumber}: Dải tương phản cân bằng (Dynamic Range 9.5 stops), không bị cháy sáng vùng highlight.`,
    dustAndScratchReport:
      'Digital ICE / Khử bụi hồng ngoại đạt chuẩn: Không phát hiện dị vật hay đường xước dọc mặt nhũ tương.',
    colorBalanceNote:
      'Cân bằng trắng chuẩn âm bản Kodak, tông màu da tự nhiên, không ám xanh lá vùng tối.',
    recommendation: 'File đủ tiêu chuẩn in phóng khổ 40x60cm hoặc xuất bản lên Photo Feed.',
  };
}
