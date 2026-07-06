import multer from "multer";

// Configure storage allocation within RAM for fast local pipeline handoffs
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Enforce a 50MB upper constraint for safety
  },
  fileFilter: (req, file, cb) => {
    // Strictly restrict inputs to PDF documents
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Invalid document format. Only PDF files are supported."));
    }
  },
});