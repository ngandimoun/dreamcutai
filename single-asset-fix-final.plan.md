# Correction : Un Seul Asset Visible en Mode Single

## Problème identifié

D'après l'analyse du code et l'image fournie, **deux éléments** s'affichent simultanément dans la section "🖼️ Upload Asset *" en mode Single :

1. **Miniature de l'asset uploadé** : "logo-animation.mp4" (0.00 MB) - lignes 3697-3735
2. **Preview du chart sélectionné** : "456s Chart/Infographic" - lignes 3738-3767

### Code actuel problématique (lignes 3738-3767)

```typescript
{/* Preview for selected chart */}
{selectedChartId && selectedChart && (
  <div className="p-3 bg-muted/30 rounded-lg border">
    <div className="flex items-center gap-3">
      {/* Image du chart */}
      <div className="flex-1">
        <p className="font-semibold text-primary text-sm">
          {selectedChart.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {selectedChart.description || 'Chart/Infographic'}
        </p>
      </div>
    </div>
  </div>
)}
```

**Problème** : Cette section s'affiche TOUJOURS quand un chart est sélectionné, même si un asset est déjà uploadé.

## Solution

### Objectif

En mode Single, **un seul élément** doit être visible à la fois :
- Si un asset est uploadé → afficher la miniature de l'asset
- Si un chart est sélectionné ET qu'aucun asset n'est uploadé → afficher le preview du chart
- **Nouvelle sélection remplace la précédente**

### Modifications à apporter

#### 1. Conditionner l'affichage du preview de chart (ligne 3739)

**Avant** :
```typescript
{selectedChartId && selectedChart && (
```

**Après** :
```typescript
{selectedChartId && selectedChart && uploadedFiles.length === 0 && (
```

**Explication** : Le preview du chart ne s'affiche que si aucun asset n'est uploadé.

#### 2. Conditionner l'affichage du preview d'avatar (ligne 3770)

**Avant** :
```typescript
{selectedAvatarId && selectedAvatar && (
```

**Après** :
```typescript
{selectedAvatarId && selectedAvatar && uploadedFiles.length === 0 && (
```

**Explication** : Le preview de l'avatar ne s'affiche que si aucun asset n'est uploadé.

#### 3. Réinitialiser les sélections lors de l'upload d'un asset

Modifier `handleFileUpload` pour réinitialiser `selectedChartId` et `selectedAvatarId` :

```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // ... code existant ...
  
  // En mode single, réinitialiser les sélections de chart/avatar
  if (mode === 'single') {
    setSelectedChartId("")
    setSelectedAvatarId("")
  }
  
  // ... reste du code ...
}
```

#### 4. Remplacer l'asset lors de la sélection d'un chart/avatar

Modifier les fonctions de sélection pour remplacer l'asset existant :

**Dans handleOpenChartsAPI** (ou équivalent) :
```typescript
const handleSelectChart = (chartId: string) => {
  setSelectedChartId(chartId)
  
  // En mode single, supprimer l'asset uploadé si présent
  if (mode === 'single' && uploadedFiles.length > 0) {
    // Révoquer les URLs
    assetPreviews.forEach(url => URL.revokeObjectURL(url))
    setUploadedFiles([])
    setAssetPreviews([])
  }
}
```

## Logique finale

### Priorité d'affichage en mode Single

1. **Asset uploadé** (fichier local) → priorité haute
   - Masque automatiquement les previews de chart/avatar
   
2. **Chart sélectionné** (depuis API) → priorité moyenne
   - S'affiche uniquement si aucun asset n'est uploadé
   
3. **Avatar sélectionné** (depuis API) → priorité moyenne
   - S'affiche uniquement si aucun asset n'est uploadé

### Comportement de remplacement

- **Upload un asset** → Efface les sélections de chart/avatar
- **Sélectionner un chart** → Efface l'asset uploadé (optionnel, ou juste masquer)
- **Sélectionner depuis la bibliothèque** → Remplace tout (déjà implémenté)

## Fichiers à modifier

1. **`components/diverse-motion-generator-interface.tsx`**
   - Ligne 3739 : Ajouter condition `&& uploadedFiles.length === 0`
   - Ligne 3770 : Ajouter condition `&& uploadedFiles.length === 0`
   - Ligne ~1100-1170 : Modifier `handleFileUpload` pour réinitialiser les sélections
   - (Optionnel) Modifier les handlers de sélection de chart/avatar

## Résumé des modifications

### Étape 1 : Masquer les previews quand un asset est uploadé
- Ajouter `&& uploadedFiles.length === 0` aux conditions d'affichage des previews

### Étape 2 : Réinitialiser les sélections lors de l'upload
- Dans `handleFileUpload`, ajouter `setSelectedChartId("")` et `setSelectedAvatarId("")`

### Étape 3 : (Optionnel) Effacer l'asset lors de la sélection d'un chart
- Modifier les handlers de sélection pour vider `uploadedFiles` si nécessaire

### Étape 4 : Vérifier qu'il n'y a pas d'erreurs de linting

## To-dos

- [ ] Ajouter condition uploadedFiles.length === 0 au preview de chart (ligne 3739)
- [ ] Ajouter condition uploadedFiles.length === 0 au preview d'avatar (ligne 3770)
- [ ] Modifier handleFileUpload pour réinitialiser selectedChartId et selectedAvatarId
- [ ] Vérifier qu'il n'y a pas d'erreurs de linting
- [ ] Tester que la nouvelle sélection remplace bien la précédente

