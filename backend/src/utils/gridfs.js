const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = mongoose.mongo;

const getBucket = () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('MongoDB must be connected before using file storage.');
  }

  return new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
};

const uploadBuffer = ({ buffer, filename, contentType, metadata }) => new Promise((resolve, reject) => {
  const bucket = getBucket();
  const uploadStream = bucket.openUploadStream(filename, {
    contentType,
    metadata,
  });

  uploadStream.once('error', reject);
  uploadStream.once('finish', () => resolve(uploadStream.id));
  uploadStream.end(buffer);
});

const deleteFile = async (fileId) => {
  if (!fileId) return;

  const bucket = getBucket();
  const objectId = fileId instanceof ObjectId ? fileId : new ObjectId(fileId);

  try {
    await bucket.delete(objectId);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

module.exports = { uploadBuffer, deleteFile };
