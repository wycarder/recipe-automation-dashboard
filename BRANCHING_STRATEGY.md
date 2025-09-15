# 🌿 Branching Strategy

## ✅ **Baseline Established**

**Tag**: `v1.0-baseline`  
**Status**: ✅ **STABLE & WORKING**

### What's Working:
- Netlify frontend with website selection
- Copy-to-clipboard button for commands
- Local automation with PinClicks integration
- CSV processing and Notion sync
- Tested: 16 recipes successfully synced

---

## 🚀 **Development Workflow**

### **Main Branch (`main`)**
- **Purpose**: Production-ready code
- **Status**: Always stable and deployable
- **Usage**: Only merge tested features here

### **Development Branch (`feature/development`)**
- **Purpose**: Testing new features
- **Status**: Experimental - may break
- **Usage**: Test new features here first

### **Feature Branches**
- **Purpose**: Individual feature development
- **Naming**: `feature/feature-name` (e.g., `feature/better-ui`, `feature/new-automation`)
- **Usage**: Develop specific features

---

## 📋 **How to Work with Branches**

### **Testing New Features:**
```bash
# Start from main (stable baseline)
git checkout main
git pull origin main

# Create a new feature branch
git checkout -b feature/your-feature-name

# Make your changes...
# Test your changes...

# If it works, merge to development branch
git checkout feature/development
git merge feature/your-feature-name

# Test on development branch
# If everything works, merge to main
git checkout main
git merge feature/development
git push origin main
```

### **Quick Testing:**
```bash
# Switch to development branch
git checkout feature/development

# Make changes and test
# If it breaks, easily go back to stable
git checkout main
```

### **Emergency Rollback:**
```bash
# Go back to stable baseline
git checkout main
git tag v1.0-baseline
```

---

## 🎯 **Current Setup**

- **✅ Stable Baseline**: `v1.0-baseline` tag
- **🔧 Development**: `feature/development` branch (current)
- **🚀 Production**: `main` branch

---

## 📝 **Best Practices**

1. **Always test on development branch first**
2. **Keep main branch stable**
3. **Use descriptive branch names**
4. **Test thoroughly before merging to main**
5. **Tag stable releases**

---

## 🔄 **Quick Commands**

```bash
# See current branch
git branch

# Switch to main (stable)
git checkout main

# Switch to development (testing)
git checkout feature/development

# Create new feature branch
git checkout -b feature/new-feature

# Go back to baseline
git checkout v1.0-baseline
```
