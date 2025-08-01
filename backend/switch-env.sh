#!/bin/bash

# Script para cambiar entre entornos de desarrollo y producción
# Uso: ./switch-env.sh [development|production|test]

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🔧 Script de cambio de entorno - Dashboard IA${NC}"
    echo ""
    echo -e "${YELLOW}Uso:${NC}"
    echo "  ./switch-env.sh [entorno]"
    echo ""
    echo -e "${YELLOW}Entornos disponibles:${NC}"
    echo "  development  - Entorno de desarrollo local"
    echo "  production   - Entorno de producción (Render/Supabase)"
    echo "  test        - Entorno de pruebas"
    echo ""
    echo -e "${YELLOW}Ejemplos:${NC}"
    echo "  ./switch-env.sh development"
    echo "  ./switch-env.sh production"
    echo ""
}

# Función para actualizar NODE_ENV en .env
update_env() {
    local env=$1
    local env_file=".env"
    
    if [ ! -f "$env_file" ]; then
        echo -e "${RED}❌ Error: No se encontró el archivo .env${NC}"
        echo -e "${YELLOW}💡 Tip: Copia .env.example como .env primero${NC}"
        exit 1
    fi
    
    # Backup del archivo original
    cp "$env_file" "${env_file}.backup"
    
    # Actualizar NODE_ENV
    if grep -q "^NODE_ENV=" "$env_file"; then
        # Si existe la línea, reemplazarla
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/^NODE_ENV=.*/NODE_ENV=$env/" "$env_file"
        else
            # Linux
            sed -i "s/^NODE_ENV=.*/NODE_ENV=$env/" "$env_file"
        fi
    else
        # Si no existe, agregarla después de los comentarios iniciales
        echo "NODE_ENV=$env" >> "$env_file"
    fi
    
    echo -e "${GREEN}✅ Entorno cambiado a: ${env}${NC}"
}

# Función para mostrar información del entorno actual
show_current_env() {
    local env_file=".env"
    
    if [ ! -f "$env_file" ]; then
        echo -e "${RED}❌ No se encontró archivo .env${NC}"
        return 1
    fi
    
    local current_env=$(grep "^NODE_ENV=" "$env_file" | cut -d'=' -f2)
    
    if [ -z "$current_env" ]; then
        current_env="no configurado"
    fi
    
    echo -e "${BLUE}📊 Entorno actual: ${current_env}${NC}"
    
    # Mostrar configuración relevante según el entorno
    case $current_env in
        "development")
            echo -e "${YELLOW}🔧 Configuración de desarrollo:${NC}"
            echo "  - Base de datos: PostgreSQL local"
            echo "  - Puerto: $(grep "^PORT_DEV=" "$env_file" | cut -d'=' -f2 || echo "4000")"
            echo "  - Swagger: Habilitado"
            echo "  - Logging: Completo"
            ;;
        "production")
            echo -e "${YELLOW}🚀 Configuración de producción:${NC}"
            echo "  - Base de datos: Supabase"
            echo "  - Puerto: $(grep "^PORT=" "$env_file" | cut -d'=' -f2 || echo "4000")"
            echo "  - Swagger: Deshabilitado"
            echo "  - Logging: Solo errores"
            ;;
        "test")
            echo -e "${YELLOW}🧪 Configuración de pruebas:${NC}"
            echo "  - Base de datos: Test DB"
            echo "  - Puerto: 4001"
            echo "  - Swagger: Deshabilitado"
            echo "  - Logging: Silenciado"
            ;;
    esac
}

# Función principal
main() {
    case $1 in
        "development"|"production"|"test")
            update_env $1
            echo ""
            show_current_env
            echo ""
            echo -e "${GREEN}🎉 ¡Listo! Reinicia el servidor para aplicar los cambios.${NC}"
            ;;
        "status"|"current"|"")
            show_current_env
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}❌ Entorno no válido: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main $1
