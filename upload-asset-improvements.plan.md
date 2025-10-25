# Amélioration de l'Upload Asset avec Miniature et Sélection Unique

## Objectif

Modifier la section "🖼️ Upload Asset *" pour :
1. Permettre la sélection d'un seul élément à la fois depuis la bibliothèque
2. Afficher l'élément sélectionné en miniature dans la section "🖼️ Upload Asset *"
3. Adapter le comportement en fonction de la catégorie sélectionnée dans "📂 Content Category"

## Analyse du code actuel

### Composants identifiés

**Fichier** : `components/diverse-motion-generator-interface.tsx`

**États actuels** :
- `showAssetLibrary` (ligne 536) : Contrôle l'affichage du modal
- `librarySelectionMode` (ligne 537) : Mode de sélection ('single' | 'dual' | 'multi')
- `libraryTargetIndex` (ligne 538) : Index cible pour l'asset
- `uploadedFiles` : Tableau des fichiers uploadés
- `assetPreviews` : Tableau des aperçus des assets

**Fonctions clés** :
- `handleOpenAssetLibrary(mode)` (ligne 739-741) : Ouvre le modal de bibliothèque
- `handleSelectFromLibrary(selectedAssets)` (ligne 743-777) : Gère la sélection depuis la bibliothèque

### Sections Upload Asset identifiées

1. **Mode Single** (ligne ~3539) : Section "🖼️ Upload Asset *"
2. **Mode Dual** (ligne ~4487 et ~4672) : "Upload Asset 1 *" et "Upload Asset 2 *"
3. **Mode Multi** (ligne ~5587) : "Upload Asset {index + 1} *"

## Problèmes actuels

1. **Sélection multiple activée** : Le modal permet la sélection de plusieurs assets même en mode single
2. **Pas de miniature** : Quand un asset est sélectionné, il n'y a pas de prévisualisation miniature dans la section Upload
3. **Pas d'adaptation à la catégorie** : Le type d'asset accepté ne change pas selon la catégorie

## Solution proposée

### 1. Forcer la sélection unique pour le mode Single

**Modification dans** : `components/diverse-motion-generator-interface.tsx`

Le modal `AssetLibraryModal` est déjà configuré correctement (ligne 6510-6511) :
```typescript
multiSelect={librarySelectionMode === 'multi'}
maxSelection={librarySelectionMode === 'multi' ? 10 : 1}
```

✅ **Déjà correct** - Le modal permet déjà la sélection unique en mode 'single' et 'dual'

### 2. Afficher une miniature de l'asset sélectionné

**Problème** : Actuellement, après sélection depuis la bibliothèque, l'asset est affiché en grand format dans une section séparée (lignes 3660-3730)

**Solution** : Modifier l'affichage pour montrer une miniature compacte dans la section "🖼️ Upload Asset *"

#### Modification pour le Mode Single (ligne ~3542-3730)

**Avant** : Section avec boutons d'upload OU section avec aperçu en grand format

**Après** : 
- Si aucun asset : Boutons d'upload
- Si asset sélectionné : Miniature compacte (100x100px ou 150x150px) avec nom du fichier et bouton de suppression

```typescript
{uploadedFiles.length === 0 ? (
  // Boutons d'upload (existant)
  <div className="space-y-3">
    <input ref={fileInputRef} type="file" ... />
    <div className="grid grid-cols-2 gap-2">
      <Button onClick={() => fileInputRef.current?.click()}>
        <Upload /> Choose File
      </Button>
      <Button onClick={() => handleOpenAssetLibrary('single')}>
        <Package /> Choose from Library
      </Button>
    </div>
  </div>
) : (
  // Miniature compacte (NOUVEAU)
  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-green-300">
    {/* Miniature */}
    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
      {uploadedFiles[0].type.startsWith('image/') ? (
        <img src={assetPreviews[0]} alt="Asset" className="w-full h-full object-cover" />
      ) : (
        <video src={assetPreviews[0]} className="w-full h-full object-cover" />
      )}
    </div>
    
    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-green-700 truncate">
        {uploadedFiles[0].name}
      </p>
      <p className="text-xs text-gray-500">
        {(uploadedFiles[0].size / 1024 / 1024).toFixed(2)} MB
      </p>
    </div>
    
    {/* Bouton supprimer */}
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => removeUploadedAsset(0)}
      className="flex-shrink-0"
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
)}
```

### 3. Adapter selon la catégorie sélectionnée

**Objectif** : Filtrer les types de fichiers acceptés selon `productCategory`

#### Mapping des catégories vers les types de fichiers

```typescript
const getAcceptedFileTypes = (category: ProductCategory) => {
  switch (category) {
    case "Data Visualizations":
      return "image/*,.csv,.json" // Images + fichiers de données
    case "Infographic":
      return "image/*" // Images uniquement
    case "Logo Animation":
      return "image/*,video/*" // Images et vidéos
    case "UI/UX Element":
      return "image/*,video/*" // Images et vidéos
    case "Cinematic Videos":
      return "video/*" // Vidéos uniquement
    default:
      return "image/*,video/*"
  }
}
```

#### Modification du input file

```typescript
<input
  ref={fileInputRef}
  type="file"
  accept={getAcceptedFileTypes(productCategory)}
  onChange={handleFileUpload}
  className="hidden"
/>
```

#### Modification du texte d'aide

```typescript
<p className="text-xs text-green-600 dark:text-green-400 text-center">
  {productCategory === "Data Visualizations" && "Supported: JPG, PNG, CSV, JSON (Max 50MB)"}
  {productCategory === "Infographic" && "Supported: JPG, PNG, GIF (Max 50MB)"}
  {productCategory === "Logo Animation" && "Supported: JPG, PNG, MP4, MOV (Max 50MB)"}
  {productCategory === "UI/UX Element" && "Supported: JPG, PNG, MP4, MOV (Max 50MB)"}
  {productCategory === "Cinematic Videos" && "Supported: MP4, MOV, AVI (Max 50MB)"}
</p>
```

## Fichiers à modifier

1. `components/diverse-motion-generator-interface.tsx`
   - Ajouter la fonction `getAcceptedFileTypes`
   - Modifier la section Upload Asset en mode Single (lignes ~3542-3730)
   - Modifier la section Upload Asset en mode Dual (lignes ~4484-4630 et ~4668-4850)
   - Modifier la section Upload Asset en mode Multi (lignes ~5584-5780)
   - Mettre à jour les attributs `accept` des inputs file
   - Mettre à jour les textes d'aide selon la catégorie

## Résumé des modifications

### Étape 1 : Ajouter la fonction utilitaire
- Créer `getAcceptedFileTypes(category)` pour mapper les catégories aux types de fichiers

### Étape 2 : Modifier l'affichage des assets uploadés (Mode Single)
- Remplacer l'aperçu en grand format par une miniature compacte
- Format : Miniature 80x80px + nom + taille + bouton supprimer

### Étape 3 : Adapter les inputs file selon la catégorie
- Utiliser `accept={getAcceptedFileTypes(productCategory)}`
- Mettre à jour les textes d'aide

### Étape 4 : Appliquer les mêmes modifications aux modes Dual et Multi
- Utiliser le même format de miniature compacte
- Adapter les couleurs selon le mode (bleu/vert pour Dual, violet pour Multi)

## To-dos

- [ ] Créer la fonction getAcceptedFileTypes
- [ ] Modifier l'affichage Upload Asset en mode Single (miniature compacte)
- [ ] Modifier l'affichage Upload Asset en mode Dual Asset 1 (miniature compacte)
- [ ] Modifier l'affichage Upload Asset en mode Dual Asset 2 (miniature compacte)
- [ ] Modifier l'affichage Upload Asset en mode Multi (miniature compacte)
- [ ] Mettre à jour les attributs accept des inputs file
- [ ] Mettre à jour les textes d'aide selon la catégorie
- [ ] Vérifier qu'il n'y a pas d'erreurs de linting

