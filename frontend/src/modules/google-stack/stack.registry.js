import Step1PrepCheck from './steps/Step1PrepCheck';
import Step2Keywords from './steps/Step2Keywords';
import Step3Assets from './steps/Step3Assets';
import Step4ManualAssets from './steps/Step4ManualAssets';
import Step4Optimize from './steps/Step4Optimize';
import Step6MultiLanguage from './steps/Step6MultiLanguage';
import Step5WPEditor from './steps/Step5WPEditor';

export const GOOGLE_STACK_STEPS = [
  { id: 'prep', label: '1. Chuẩn bị (Prep Check)', component: Step1PrepCheck },
  { id: 'keywords', label: '2. Bảng Từ khóa (39 Keys)', component: Step2Keywords },
  { id: 'assets', label: '3. Tạo Drive & Sheets Assets', component: Step3Assets },
  { id: 'manual', label: '4. Tạo thủ công và nhập link', component: Step4ManualAssets },
  { id: 'optimize', label: '5. Tối ưu tài sản Google', component: Step4Optimize },
  { id: 'multilang', label: '6. Dịch thuật & Đa ngôn ngữ', component: Step6MultiLanguage },
  { id: 'wp', label: '7. WordPress Editor', component: Step5WPEditor },
];

