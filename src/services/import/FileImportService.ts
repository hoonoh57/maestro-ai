export type ImportKind = 'guitar-pro' | 'musicxml' | 'alphatex' | 'image-score' | 'pdf-score' | 'unsupported';

export interface FileImportInfo {
  kind: ImportKind;
  extension: string;
  canLoadDirectly: boolean;
  displayName: string;
  message: string;
}

export interface LoadedScoreFile {
  file: File;
  info: FileImportInfo;
  baseName: string;
}

const GUITAR_PRO_EXTENSIONS = new Set(['gp', 'gp3', 'gp4', 'gp5', 'gp6', 'gp7', 'gp8', 'gpx']);
const MUSIC_XML_EXTENSIONS = new Set(['musicxml', 'xml', 'mxl']);
const ALPHATEX_EXTENSIONS = new Set(['atx', 'tex', 'alphatex', 'txt']);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);

export const SCORE_FILE_ACCEPT = [
  '.gp', '.gp3', '.gp4', '.gp5', '.gp6', '.gp7', '.gp8', '.gpx',
  '.musicxml', '.xml', '.mxl',
  '.atx', '.tex', '.alphatex', '.txt',
  '.pdf', '.png', '.jpg', '.jpeg', '.webp',
].join(',');

export function getFileExtension(fileName: string): string {
  const cleanName = fileName.trim().toLowerCase();
  const dotIndex = cleanName.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex === cleanName.length - 1) return '';
  return cleanName.slice(dotIndex + 1);
}

export function getBaseFileName(fileName: string): string {
  const cleanName = fileName.trim();
  const slashIndex = Math.max(cleanName.lastIndexOf('/'), cleanName.lastIndexOf('\\'));
  const onlyName = slashIndex >= 0 ? cleanName.slice(slashIndex + 1) : cleanName;
  const dotIndex = onlyName.lastIndexOf('.');
  if (dotIndex <= 0) return onlyName || 'Untitled Score';
  return onlyName.slice(0, dotIndex) || 'Untitled Score';
}

export function inspectImportFile(file: File): FileImportInfo {
  const extension = getFileExtension(file.name);

  if (GUITAR_PRO_EXTENSIONS.has(extension)) {
    return {
      kind: 'guitar-pro',
      extension,
      canLoadDirectly: true,
      displayName: 'Guitar Pro',
      message: 'Guitar Pro score can be loaded directly.',
    };
  }

  if (MUSIC_XML_EXTENSIONS.has(extension)) {
    return {
      kind: 'musicxml',
      extension,
      canLoadDirectly: true,
      displayName: 'MusicXML',
      message: 'MusicXML score can be loaded directly.',
    };
  }

  if (ALPHATEX_EXTENSIONS.has(extension)) {
    return {
      kind: 'alphatex',
      extension,
      canLoadDirectly: true,
      displayName: 'alphaTex',
      message: 'Text score will be loaded as alphaTex.',
    };
  }

  if (extension === 'pdf') {
    return {
      kind: 'pdf-score',
      extension,
      canLoadDirectly: false,
      displayName: 'PDF score',
      message: 'PDF scores need OMR conversion to MusicXML before rendering.',
    };
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return {
      kind: 'image-score',
      extension,
      canLoadDirectly: false,
      displayName: 'Image score',
      message: 'Image scores need OMR conversion to MusicXML before rendering.',
    };
  }

  return {
    kind: 'unsupported',
    extension,
    canLoadDirectly: false,
    displayName: 'Unsupported file',
    message: extension
      ? `.${extension} files are not supported yet.`
      : 'This file has no extension and cannot be imported yet.',
  };
}

export function createLoadedScoreFile(file: File): LoadedScoreFile {
  return {
    file,
    info: inspectImportFile(file),
    baseName: getBaseFileName(file.name),
  };
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error(`File is not text: ${file.name}`));
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

export function readBinaryFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error(`File is not binary: ${file.name}`));
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}
