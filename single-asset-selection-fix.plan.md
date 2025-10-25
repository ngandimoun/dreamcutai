# Correction : Un Seul Asset en Mode Single

## Problème identifié

D'après l'image fournie, la section "🖼️ Upload Asset *" en mode Single affiche **deux éléments** :
1. Une miniature de "logo-animation.mp4" (0.00 MB)
2. Un élément "456s Chart/Infographic"

**Problème** : Le code actuel semble permettre l'ajout de plusieurs assets alors qu'en mode Single, un seul asset devrait être visible à la fois.

## Cause probable

Le code que nous avons modifié affiche correctement UNE miniature pour `uploadedFiles[0]`, mais il semble y avoir :
1. Soit un deuxième élément qui s'affiche en dessous (peut-être un chart ou un autre asset)
2. Soit la logique de sélection depuis la bibliothèque qui ajoute au lieu de remplacer

## Analyse du code actuel

### Section Upload Asset en mode Single (ligne ~3696-3735)

```typescript
) : (
  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-green-300">
    {/* Miniature pour uploadedFiles[0] */}
    ...
  </div>
)}
```

### Fonction handleSelectFromLibrary (ligne ~743-777)

```typescript
const handleSelectFromLibrary = (selectedAssets: any[]) => {
  if (selectedAssets.length === 0) return

  // Convert library assets to files and previews
  const newFiles: File[] = []
  const newPreviews: string[] = []
  
  // ...conversion logic...

  // Update uploaded files and previews
  if (librarySelectionMode === 'single') {
    setUploadedFiles([newFiles[0]])  // ✅ Correct - remplace par un seul
    setAssetPreviews([newPreviews[0]])
  } else if (librarySelectionMode === 'dual') {
    // ...
  }
}
```

## Hypothèses

1. **Hypothèse 1** : Il y a un deuxième élément qui s'affiche (chart preview ou autre) en dessous de la miniature
2. **Hypothèse 2** : Le `uploadedFiles` contient plus d'un élément malgré la logique de sélection unique
3. **Hypothèse 3** : Il y a une autre section qui affiche un asset sélectionné (comme un chart preview)

## Solution

### Étape 1 : Vérifier qu'il n'y a pas d'autres sections d'affichage

Chercher dans le code après la section Upload Asset s'il y a :
- Une section "Preview for selected chart" (ligne ~3738)
- Une section d'affichage d'avatar ou de chart

### Étape 2 : S'assurer que la sélection remplace toujours

Modifier `handleSelectFromLibrary` pour TOUJOURS remplacer en mode single :

```typescript
if (librarySelectionMode === 'single') {
  // Révoquer les anciens URLs pour libérer la mémoire
  uploadedFiles.forEach((_, index) => {
    if (assetPreviews[index]) {
      URL.revokeObjectURL(assetPreviews[index])
    }
  })
  
  // Remplacer complètement par le nouvel asset
  setUploadedFiles([newFiles[0]])
  setAssetPreviews([newPreviews[0]])
}
```

### Étape 3 : Vérifier handleFileUpload

S'assurer que `handleFileUpload` remplace aussi en mode single :

```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // ...validation...
  
  if (mode === 'single') {
    // Révoquer l'ancien preview
    if (assetPreviews[0]) {
      URL.revokeObjectURL(assetPreviews[0])
    }
    // Remplacer complètement
    setUploadedFiles([file])
    setAssetPreviews([previewUrl])
  } else {
    // Mode dual/multi - ajouter
    setUploadedFiles([...uploadedFiles, file])
    setAssetPreviews([...assetPreviews, previewUrl])
  }
}
```

### Étape 4 : Masquer les sections de preview supplémentaires en mode Single

Si une section "Preview for selected chart" existe, s'assurer qu'elle ne s'affiche pas en même temps que l'Upload Asset :

```typescript
{/* Preview for selected chart */}
{selectedChartId && selectedChart && uploadedFiles.length === 0 && (
  // Afficher uniquement si aucun asset n'est uploadé
  ...
)}
```

## Fichiers à vérifier/modifier

1. `components/diverse-motion-generator-interface.tsx`
   - Ligne ~743-777 : `handleSelectFromLibrary`
   - Ligne ~1100-1170 : `handleFileUpload`
   - Ligne ~3738+ : Vérifier s'il y a d'autres sections d'affichage

## To-dos

- [ ] Lire la section après Upload Asset pour identifier l'élément supplémentaire
- [ ] Vérifier la logique de handleSelectFromLibrary
- [ ] Vérifier la logique de handleFileUpload
- [ ] S'assurer que la sélection remplace toujours en mode Single
- [ ] Masquer les sections de preview supplémentaires si nécessaire
- [ ] Tester que la nouvelle sélection remplace bien la précédente

