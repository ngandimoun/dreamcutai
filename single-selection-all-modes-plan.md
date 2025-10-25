# Amélioration : Sélection Unique et Bouton de Suppression

## Objectifs

1. **Appliquer la logique de sélection unique** pour tous les modes (Single, Dual, Multi)
2. **Ajouter un bouton de suppression** (X) pour les previews de Chart et Avatar sélectionnés

## Analyse Actuelle

### État actuel (Mode Single uniquement)

Les previews de Chart et Avatar sont présents **uniquement en mode Single** (lignes 3744-3804) :

- ✅ Preview de Chart (ligne 3744-3773)
- ✅ Preview d'Avatar (ligne 3775-3804)
- ✅ Condition `uploadedFiles.length === 0` déjà ajoutée
- ❌ **Pas de bouton de suppression**

### Modes Dual et Multi

Les modes Dual et Multi **n'ont PAS** de sections de preview pour Chart/Avatar. Ils utilisent uniquement l'upload direct de fichiers.

## Solution

### Partie 1 : Ajouter un bouton de suppression aux previews (Mode Single)

#### 1.1 Modifier le preview de Chart (ligne 3746-3772)

**Avant** :
```typescript
<div className="p-3 bg-muted/30 rounded-lg border">
  <div className="flex items-center gap-3">
    {/* Image */}
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
```

**Après** :
```typescript
<div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
  {/* Image du chart */}
  {getChartImageUrl(selectedChart) ? (
    <img 
      src={getChartImageUrl(selectedChart)} 
      alt={selectedChart.title}
      className="w-12 h-12 object-cover rounded-lg border border-border flex-shrink-0"
      onError={(e) => {
        console.error('Chart image failed to load:', getChartImageUrl(selectedChart))
        e.currentTarget.style.display = 'none'
      }}
    />
  ) : (
    <div className="w-12 h-12 bg-muted rounded-lg border border-border flex items-center justify-center flex-shrink-0">
      <BarChart className="h-6 w-6 text-muted-foreground" />
    </div>
  )}
  
  {/* Info */}
  <div className="flex-1 min-w-0">
    <p className="font-semibold text-primary text-sm truncate">
      {selectedChart.title}
    </p>
    <p className="text-xs text-muted-foreground truncate">
      {selectedChart.description || 'Chart/Infographic'}
    </p>
  </div>
  
  {/* Bouton supprimer */}
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={() => setSelectedChartId("")}
    className="flex-shrink-0"
  >
    <X className="h-4 w-4" />
  </Button>
</div>
```

#### 1.2 Modifier le preview d'Avatar (ligne 3777-3803)

**Même structure que le Chart**, remplacer par :
```typescript
<div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
  {/* Image de l'avatar */}
  {getAvatarImageUrl(selectedAvatar) ? (
    <img 
      src={getAvatarImageUrl(selectedAvatar)} 
      alt={selectedAvatar.title || selectedAvatar.name}
      className="w-12 h-12 object-cover rounded-lg border border-border flex-shrink-0"
      onError={(e) => {
        console.error('Avatar image failed to load:', getAvatarImageUrl(selectedAvatar))
        e.currentTarget.style.display = 'none'
      }}
    />
  ) : (
    <div className="w-12 h-12 bg-muted rounded-lg border border-border flex items-center justify-center flex-shrink-0">
      <Users className="h-6 w-6 text-muted-foreground" />
    </div>
  )}
  
  {/* Info */}
  <div className="flex-1 min-w-0">
    <p className="font-semibold text-primary text-sm truncate">
      {selectedAvatar.title || selectedAvatar.name}
    </p>
    <p className="text-xs text-muted-foreground truncate">
      {selectedAvatar.description || selectedAvatar.role}
    </p>
  </div>
  
  {/* Bouton supprimer */}
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={() => setSelectedAvatarId("")}
    className="flex-shrink-0"
  >
    <X className="h-4 w-4" />
  </Button>
</div>
```

### Partie 2 : Logique de sélection unique (Déjà implémentée)

✅ **Déjà fait** :
- Preview masqué quand `uploadedFiles.length > 0`
- Sélections réinitialisées lors de l'upload d'un fichier

### Partie 3 : Modes Dual et Multi (Pas de changement nécessaire)

Les modes Dual et Multi n'ont pas de previews de Chart/Avatar, donc **aucune modification nécessaire**.

## Résumé des Modifications

### Fichier à modifier

**`components/diverse-motion-generator-interface.tsx`**

### Modifications

1. **Preview de Chart (lignes 3746-3772)**
   - Restructurer en format horizontal avec flex
   - Ajouter `flex-shrink-0` aux images
   - Ajouter `truncate` aux textes
   - Ajouter bouton de suppression avec `onClick={() => setSelectedChartId("")}`

2. **Preview d'Avatar (lignes 3777-3803)**
   - Restructurer en format horizontal avec flex
   - Ajouter `flex-shrink-0` aux images
   - Ajouter `truncate` aux textes
   - Ajouter bouton de suppression avec `onClick={() => setSelectedAvatarId("")}`

## Design Final

### Preview de Chart/Avatar avec bouton de suppression

```
┌─────────────────────────────────────────────┐
│ [Image]  Title                          [X] │
│ 12x12    Description                        │
└─────────────────────────────────────────────┘
```

- **Image** : 48x48px (w-12 h-12), flex-shrink-0
- **Info** : flex-1 min-w-0 avec truncate
- **Bouton X** : flex-shrink-0, variant ghost

## To-dos

- [ ] Restructurer le preview de Chart avec bouton de suppression (ligne 3746-3772)
- [ ] Restructurer le preview d'Avatar avec bouton de suppression (ligne 3777-3803)
- [ ] Vérifier qu'il n'y a pas d'erreurs de linting
- [ ] Tester que le bouton de suppression fonctionne correctement

