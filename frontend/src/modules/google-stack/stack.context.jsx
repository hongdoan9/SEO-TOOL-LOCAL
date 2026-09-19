import React, { createContext, useContext, useState, useEffect } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { KEYWORD_FIELDS } from '../../constants/keywordFields';

const StackContext = createContext();

export function StackProvider({ children }) {
  const { googleStacks, googleConnected, handleConnectGoogle } = useProjectData();
  
  const [activeStackId, setActiveStackId] = useState(null);
  const [selectedStack, setSelectedStack] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  
  const [stackKeywords, setStackKeywords] = useState(() => {
    const initial = {};
    KEYWORD_FIELDS.forEach(f => { initial[f.key] = ''; });
    return initial;
  });

  // Bulk texts
  const [bulkText1, setBulkText1] = useState('');
  const [bulkText2, setBulkText2] = useState('');
  const [bulkText3, setBulkText3] = useState('');
  const [bulkText4, setBulkText4] = useState('');

  // Prep info
  const [prepChecks, setPrepChecks] = useState({ image: false, schema: false, nap: false, map: false, keywords: false });
  const [prepBrand, setPrepBrand] = useState('');
  const [prepPhone, setPrepPhone] = useState('');
  const [prepAddress, setPrepAddress] = useState('');
  const [prepMapUrl, setPrepMapUrl] = useState('');
  const [manualVideoDone, setManualVideoDone] = useState(false);

  // Google OAuth & Assets
  const [creatingAssets, setCreatingAssets] = useState(false);
  const [assetCreationProgress, setAssetCreationProgress] = useState('');
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [isOptimizingDocs, setIsOptimizingDocs] = useState(false);
  const [optimizeResults, setOptimizeResults] = useState([]);
  const [isOptimizingPdf, setIsOptimizingPdf] = useState(false);
  const [pdfResults, setPdfResults] = useState([]);
  const [isOptimizingSheet, setIsOptimizingSheet] = useState(false);
  const [sheetOptimizeResult, setSheetOptimizeResult] = useState(null);
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash:free');

  // Multi-Language AI
  const [isTranslatingKeys, setIsTranslatingKeys] = useState(false);
  const [isCreatingLangAssets, setIsCreatingLangAssets] = useState(false);
  const [optimizingPhase, setOptimizingPhase] = useState({ 1: false, 2: false, 3: false });
  const [langData, setLangData] = useState({});
  const [langOptResults, setLangOptResults] = useState({});
  const [contentUrls, setContentUrls] = useState({});

  // Step 4 Files
  const [step4Data, setStep4Data] = useState([]);
  const [step4Images, setStep4Images] = useState([]);
  const [uploadingStep4File, setUploadingStep4File] = useState(false);
  const [uploadingStep4Images, setUploadingStep4Images] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  
  // WordPress
  const [wpTitle, setWpTitle] = useState('');
  const [wpContent, setWpContent] = useState('');

  useEffect(() => {
    if (activeStackId) {
      const stack = googleStacks.find(s => s.id === activeStackId);
      setSelectedStack(stack || null);
    } else {
      setSelectedStack(null);
    }
  }, [activeStackId, googleStacks]);

  useEffect(() => {
    if (selectedStack) {
      if (selectedStack.keywords) {
        try {
          const parsed = typeof selectedStack.keywords === 'string' ? JSON.parse(selectedStack.keywords) : selectedStack.keywords;
          if (parsed && typeof parsed === 'object') {
            setStackKeywords(prev => ({ ...prev, ...parsed }));
          }
        } catch (e) {}
      }
      setPrepBrand(selectedStack.brand || '');
      setPrepPhone(selectedStack.phone || '');
      setPrepAddress(selectedStack.address || '');
      // Load prep check data from DB
      if (selectedStack.prep_checks) {
        const pc = typeof selectedStack.prep_checks === 'string' ? JSON.parse(selectedStack.prep_checks) : selectedStack.prep_checks;
        setPrepChecks(pc);
      } else {
        setPrepChecks({ image: false, schema: false, nap: false, map: false, keywords: false });
      }
      setPrepMapUrl(selectedStack.google_map_url || '');
      setManualVideoDone(Boolean(selectedStack.manual_video_done));
      if (selectedStack.step4_images) {
        try {
          const imgs = typeof selectedStack.step4_images === 'string' ? JSON.parse(selectedStack.step4_images) : selectedStack.step4_images;
          setStep4Images(imgs || []);
        } catch (e) {
          setStep4Images([]);
        }
      }
      if (selectedStack.step4_data) {
        try {
          const d = typeof selectedStack.step4_data === 'string' ? JSON.parse(selectedStack.step4_data) : selectedStack.step4_data;
          setStep4Data(d || []);
        } catch (e) {
          setStep4Data([]);
        }
      }
      if (selectedStack.optimize_results) {
        try {
          const res = typeof selectedStack.optimize_results === 'string' ? JSON.parse(selectedStack.optimize_results) : selectedStack.optimize_results;
          setOptimizeResults(res || []);
        } catch (e) {}
      } else {
        setOptimizeResults([]);
      }
      if (selectedStack.pdf_results) {
        try {
          const res = typeof selectedStack.pdf_results === 'string' ? JSON.parse(selectedStack.pdf_results) : selectedStack.pdf_results;
          setPdfResults(res || []);
        } catch (e) {}
      } else {
        setPdfResults([]);
      }
      if (selectedStack.button3_results) {
        try {
          const res = typeof selectedStack.button3_results === 'string' ? JSON.parse(selectedStack.button3_results) : selectedStack.button3_results;
          setSheetOptimizeResult(res || null);
        } catch (e) {}
      } else {
        setSheetOptimizeResult(null);
      }
      // Load multi-language data from DB
      if (selectedStack.languages_data) {
        try {
          const ld = typeof selectedStack.languages_data === 'string' ? JSON.parse(selectedStack.languages_data) : selectedStack.languages_data;
          setLangData(ld || {});
        } catch (e) { setLangData({}); }
      } else {
        setLangData({});
      }
      if (selectedStack.languages_opt_results) {
        try {
          const lor = typeof selectedStack.languages_opt_results === 'string' ? JSON.parse(selectedStack.languages_opt_results) : selectedStack.languages_opt_results;
          setLangOptResults(lor || {});
        } catch (e) { setLangOptResults({}); }
      } else {
        setLangOptResults({});
      }
    } else {
      const initial = {};
      KEYWORD_FIELDS.forEach(f => { initial[f.key] = ''; });
      setStackKeywords(initial);
      setPrepChecks({ image: false, schema: false, nap: false, map: false, keywords: false });
      setPrepBrand('');
      setPrepPhone('');
      setPrepAddress('');
      setPrepMapUrl('');
      setManualVideoDone(false);
      setStep4Images([]);
      setOptimizeResults([]);
      setPdfResults([]);
      setSheetOptimizeResult(null);
      setLangData({});
      setLangOptResults({});
    }
  }, [selectedStack]);

  return (
    <StackContext.Provider value={{
      activeStackId, setActiveStackId,
      selectedStack, setSelectedStack,
      activeJobId, setActiveJobId,
      stackKeywords, setStackKeywords,
      bulkText1, setBulkText1,
      bulkText2, setBulkText2,
      bulkText3, setBulkText3,
      bulkText4, setBulkText4,
      prepChecks, setPrepChecks,
      prepBrand, setPrepBrand,
      prepPhone, setPrepPhone,
      prepAddress, setPrepAddress,
      prepMapUrl, setPrepMapUrl,
      manualVideoDone, setManualVideoDone,
      creatingAssets, setCreatingAssets,
      assetCreationProgress, setAssetCreationProgress,
      syncingDrive, setSyncingDrive,
      syncProgress, setSyncProgress,
      isOptimizingDocs, setIsOptimizingDocs,
      optimizeResults, setOptimizeResults,
      isOptimizingPdf, setIsOptimizingPdf,
      pdfResults, setPdfResults,
      isOptimizingSheet, setIsOptimizingSheet,
      sheetOptimizeResult, setSheetOptimizeResult,
      selectedModel, setSelectedModel,
      isTranslatingKeys, setIsTranslatingKeys,
      isCreatingLangAssets, setIsCreatingLangAssets,
      optimizingPhase, setOptimizingPhase,
      langData, setLangData,
      langOptResults, setLangOptResults,
      contentUrls, setContentUrls,
      step4Data, setStep4Data,
      step4Images, setStep4Images,
      uploadingStep4File, setUploadingStep4File,
      uploadingStep4Images, setUploadingStep4Images,
      zoomImage, setZoomImage,
      wpTitle, setWpTitle,
      wpContent, setWpContent
    }}>
      {children}
    </StackContext.Provider>
  );
}

export function useStack() {
  return useContext(StackContext);
}
