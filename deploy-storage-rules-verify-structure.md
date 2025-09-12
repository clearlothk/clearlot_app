# Deploy Storage Rules for New Verify Structure

## Overview
Updated Firebase Storage rules to support the new organized verification document structure.

## New Storage Structure
```
vertify/
├── {userId}/
│   ├── businessRegistration/
│   │   └── {timestamp}_{filename}
│   ├── companyRegistration/
│   │   └── {timestamp}_{filename}
│   ├── businessLicense/
│   │   └── {timestamp}_{filename}
│   ├── taxCertificate/
│   │   └── {timestamp}_{filename}
│   └── bankStatement/
│       └── {timestamp}_{filename}
```

## Changes Made

### 1. Updated File Upload Path
- **Before**: `{userId}/{fileType}/{timestamp}_{filename}`
- **After**: `vertify/{userId}/{fileType}/{timestamp}_{filename}`

### 2. Simplified Storage Rules
- **Before**: Separate rules for each document type
- **After**: Single rule for all verification documents under `/vertify/{userId}/{fileType}/{fileName}`

## Deploy Commands

### Deploy Storage Rules
```bash
firebase deploy --only storage
```

### Verify Deployment
1. Check Firebase Console > Storage > Rules
2. Ensure the new rule is active:
```javascript
match /vertify/{userId}/{fileType}/{fileName} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

## Benefits of New Structure

1. **Better Organization**: All verification documents are grouped under a single `vertify` folder
2. **Scalability**: Easy to manage as user base grows
3. **Cleaner Structure**: Logical hierarchy: vertify → user → document type → file
4. **Simplified Rules**: Single rule covers all verification document types
5. **Easier Maintenance**: Clear separation of concerns

## Migration Notes

- **Existing Files**: Files uploaded with the old structure will continue to work
- **New Uploads**: All new verification document uploads will use the new structure
- **No Breaking Changes**: The application continues to work seamlessly

## Testing

1. Upload a new verification document
2. Check Firebase Storage console to verify the new path structure
3. Confirm the file is accessible and the URL is stored correctly in Firestore 