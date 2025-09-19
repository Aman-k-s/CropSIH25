from django.apps import AppConfig
import ee

class FieldConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'field'

    def ready(self):
        try: 
            ee.Initialize(project="nabard-field-data")
        except Exception as e:
            print("Earth Engine initialization failed: ", e)