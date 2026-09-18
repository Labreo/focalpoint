"""
User Pathology Profile Manager for FocalPoint
Stores and retrieves individual ophthalmic parameters in DynamoDB.
Provides clinically calibrated default profiles for major visual impairments.
"""
from typing import Any, Dict
import datetime
import logging

logger = logging.getLogger(__name__)

DEFAULT_PROFILES: Dict[str, Dict[str, Any]] = {
    "AMD": {
        "pathologyType": "AMD",
        "description": "Age-Related Macular Degeneration (Central Scotoma)",
        "dwellThresholdMs": 280,
        "maxDispersionPx": 65,
        "preferredContrastTheme": "YELLOW_ON_BLACK",
        "fontScaleRem": 2.2,
        "prlOffset": {"x": 120, "y": -80},
        "scotomaRadiusPx": 110,
        "tunnelRadiusPx": 0,
        "audioHapticEnabled": True
    },
    "TUNNEL_VISION": {
        "pathologyType": "TUNNEL_VISION",
        "description": "Retinitis Pigmentosa (Peripheral Constriction)",
        "dwellThresholdMs": 300,
        "maxDispersionPx": 55,
        "preferredContrastTheme": "CYAN_ON_BLACK",
        "fontScaleRem": 1.8,
        "prlOffset": {"x": 0, "y": 0},
        "scotomaRadiusPx": 0,
        "tunnelRadiusPx": 240,
        "audioHapticEnabled": True
    },
    "LOW_ACUITY": {
        "pathologyType": "LOW_ACUITY",
        "description": "Diabetic Retinopathy & General Low Acuity",
        "dwellThresholdMs": 260,
        "maxDispersionPx": 70,
        "preferredContrastTheme": "YELLOW_ON_BLACK",
        "fontScaleRem": 2.5,
        "prlOffset": {"x": 0, "y": 0},
        "scotomaRadiusPx": 0,
        "tunnelRadiusPx": 0,
        "audioHapticEnabled": True
    },
    "HEMIANOPIA": {
        "pathologyType": "HEMIANOPIA",
        "description": "Homonymous Hemianopia (Half-Field Loss)",
        "dwellThresholdMs": 290,
        "maxDispersionPx": 60,
        "preferredContrastTheme": "WHITE_ON_BLACK",
        "fontScaleRem": 2.0,
        "prlOffset": {"x": -150, "y": 0},
        "scotomaRadiusPx": 0,
        "tunnelRadiusPx": 0,
        "audioHapticEnabled": True
    }
}

def get_profile(dynamo_table: Any, user_id: str, default_type: str = "AMD") -> Dict[str, Any]:
    """
    Fetches user profile from DynamoDB or returns default clinical baseline.
    """
    if not dynamo_table:
        return DEFAULT_PROFILES.get(default_type, DEFAULT_PROFILES["AMD"])

    try:
        resp = dynamo_table.get_item(Key={'userId': user_id, 'profileId': 'active_profile'})
        item = resp.get('Item')
        if item:
            return item
    except Exception as exc:
        logger.warning(f"Failed to fetch profile for user {user_id} from DynamoDB: {exc}")

    base = dict(DEFAULT_PROFILES.get(default_type, DEFAULT_PROFILES["AMD"]))
    base['userId'] = user_id
    base['profileId'] = 'active_profile'
    return base

def save_profile(dynamo_table: Any, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves or updates user profile in DynamoDB.
    """
    profile_data['userId'] = user_id
    profile_data['profileId'] = 'active_profile'
    profile_data['updatedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if dynamo_table:
        try:
            dynamo_table.put_item(Item=profile_data)
        except Exception as exc:
            logger.error(f"Failed to put profile for {user_id}: {exc}")

    return profile_data
