from bson import ObjectId

def convert_objectid_to_str(obj):
    if isinstance(obj, list):
        return [convert_objectid_to_str(i) for i in obj]
    if isinstance(obj, dict):
        new_obj = {}
        for k, v in obj.items():
            if isinstance(v, ObjectId):
                new_obj[k] = str(v)
            else:
                new_obj[k] = convert_objectid_to_str(v)
        return new_obj
    return obj