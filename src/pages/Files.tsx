import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, Image, FileText, ExternalLink, Loader2, FolderOpen, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect } from "react";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  thumbUrl: string;
  size: number;
  type: string;
  createdAt: any;
}

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const MAX_FILE_SIZE = 32 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function Files() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "files"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setFiles(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UploadedFile)));
    });
    return unsub;
  }, [user]);

  const uploadToImgbb = async (file: File): Promise<{ url: string; thumbUrl: string }> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || "Upload failed");
    return {
      url: data.data.url,
      thumbUrl: data.data.thumb?.url || data.data.url,
    };
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || !user) return;
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;

    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE) {
        setError(t("files.fileTooLarge") + ` (max 32 MB): ${file.name}`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        setError(t("files.imagesOnly"));
        continue;
      }

      setUploading(true);
      setError("");
      setUploadProgress(t("files.uploading") + ` ${file.name}...`);

      try {
        const { url, thumbUrl } = await uploadToImgbb(file);
        await addDoc(collection(db, "users", user.uid, "files"), {
          name: file.name,
          url,
          thumbUrl,
          size: file.size,
          type: file.type,
          createdAt: serverTimestamp(),
        });
        setUploadProgress("");
      } catch (e: any) {
        setError(e.message || t("files.uploadError"));
        setUploadProgress("");
      }
    }
    setUploading(false);
  };

  const deleteFile = async (fileId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "files", fileId));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">{t("files.title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t("files.subtitle")}</p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <div
          data-testid="files-drop-zone"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`glass-card p-8 flex flex-col items-center gap-3 cursor-pointer transition-all border-2 border-dashed ${
            dragOver ? "border-foreground bg-secondary/50" : "border-border"
          } ${uploading ? "cursor-not-allowed opacity-70" : "hover:border-foreground/50 hover:bg-secondary/20"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            data-testid="input-file-upload"
          />
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">{uploadProgress}</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{t("files.dropOrClick")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("files.supportedFormats")}</p>
              </div>
            </>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2"
          >
            {error}
          </motion.div>
        )}
      </motion.div>

      {/* Files Grid */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {files.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <FolderOpen className="w-10 h-10 opacity-40" />
            <p className="text-sm">{t("files.noFiles")}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">
                {files.length} {files.length === 1 ? t("files.file") : t("files.files")}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    data-testid={`card-file-${file.id}`}
                    className="glass-card overflow-hidden group relative"
                  >
                    <div
                      className="aspect-square cursor-pointer overflow-hidden bg-secondary"
                      onClick={() => setPreview(file)}
                    >
                      <img
                        src={file.thumbUrl}
                        alt={file.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`link-file-open-${file.id}`}
                        className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        data-testid={`button-file-delete-${file.id}`}
                        onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                        className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-destructive hover:bg-background transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreview(null)}
                className="absolute -top-10 right-0 p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={preview.url}
                alt={preview.name}
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />
              <div className="mt-2 flex items-center justify-between px-1">
                <p className="text-sm font-medium truncate">{preview.name}</p>
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> {t("files.openOriginal")}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
