from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import pickle
import os
import joblib
import shap
from catboost import CatBoostRegressor
from catboost import Pool

app = Flask(__name__)
CORS(app, origins=["https://carbon-care-ml.vercel.app"])

# Load CatBoost model
model_path = 'catboost_model.pkl'
if os.path.exists(model_path):
    model = joblib.load(model_path)
    print("CatBoost model loaded successfully")
else:
    print(f"Model file not found at {model_path}")
    model = None

# Initialize SHAP explainer
explainer = None
if model is not None:
    try:
        # For CatBoost, we can use TreeExplainer
        explainer = shap.TreeExplainer(model)
        print("SHAP explainer initialized successfully")
    except Exception as e:
        print(f"Error initializing SHAP explainer: {str(e)}")

# Define feature categories
FEATURE_CATEGORIES = {
    'Personal Information': [
        'Body Type', 'Sex', 'Diet', 'How Often Shower'
    ],
    'Transportation': [
        'Transport', 'Vehicle Type', 'Vehicle Monthly Distance Km', 'Frequency of Traveling by Air'
    ],
    'Lifestyle': [
        'Social Activity', 'Monthly Grocery Bill', 'How Long TV PC Daily Hour', 
        'How Long Internet Daily Hour', 'How Many New Clothes Monthly'
    ],
    'Waste & Consumption': [
        'Waste Bag Size', 'Waste Bag Weekly Count', 'Recycling', 'Cooking_With'
    ],
    'Home Energy': [
        'Heating Energy Source', 'Energy efficiency'
    ]
}


def preprocess_input_for_catboost(data):
    """
    Minimal preprocessing for CatBoost - it handles categorical features automatically
    """
    print(f"Preprocessing data for CatBoost: {data}")
    
    # Convert input data to DataFrame
    input_df = pd.DataFrame([data])
    
    # Define expected columns based on your training data
    expected_columns = [
    'Body Type', 'Sex', 'Diet', 'How Often Shower', 'Heating Energy Source',
    'Transport', 'Vehicle Type', 'Social Activity', 'Monthly Grocery Bill',
    'Frequency of Traveling by Air', 'Vehicle Monthly Distance Km',
    'Waste Bag Size', 'Waste Bag Weekly Count', 'How Long TV PC Daily Hour',
    'How Many New Clothes Monthly', 'How Long Internet Daily Hour',
    'Energy efficiency', 'Recycling', 'Cooking_With'
    ]
    
    # Fill missing columns with default values
    for col in expected_columns:
        if col not in input_df.columns:
            if col in ['Monthly Grocery Bill', 'Vehicle Monthly Distance Km', 'Waste Bag Weekly Count',
                      'How Long TV PC Daily Hour', 'How Many New Clothes Monthly', 'How Long Internet Daily Hour']:
                input_df[col] = 0
            else:
                input_df[col] = 'None'
    
    # Reorder columns to match training data order
    input_df = input_df[expected_columns]
    
    # Define categorical columns - these should match what you used during training
    categorical_features = [
        'Body Type', 'Sex', 'Diet', 'How Often Shower', 'Heating Energy Source',
        'Transport', 'Vehicle Type', 'Social Activity', 'Frequency of Traveling by Air',
        'Waste Bag Size', 'Energy efficiency', 'Recycling', 'Cooking_With'
    ]
    
    # Ensure categorical columns are strings
    for col in categorical_features:
        if col in input_df.columns:
            input_df[col] = input_df[col].astype(str)
    
    # Ensure numerical columns are numeric
    numerical_features = [
        'Monthly Grocery Bill', 'Vehicle Monthly Distance Km', 'Waste Bag Weekly Count',
        'How Long TV PC Daily Hour', 'How Many New Clothes Monthly', 'How Long Internet Daily Hour'
    ]
    
    for col in numerical_features:
        if col in input_df.columns:
            try:
                input_df[col] = pd.to_numeric(input_df[col], errors='coerce')
                input_df[col] = input_df[col].fillna(0)  # Fill NaN with 0
            except:
                input_df[col] = 0
    
    print(f"Processed DataFrame shape: {input_df.shape}")
    print(f"DataFrame dtypes:\n{input_df.dtypes}")
    print(f"Sample data:\n{input_df.head()}")
    
    return input_df
def get_category_based_shap_importance(input_df, top_individual_features=3):
    """
    Calculate SHAP values and return both category-wise and individual feature importance
    """
    try:
        if explainer is None:
            print("SHAP explainer not available")
            return [], []
        
        print(f"Input DataFrame for SHAP:")
        print(f"Shape: {input_df.shape}")
        print(f"Data types: {input_df.dtypes.to_dict()}")
        
        # Calculate SHAP values
        shap_values = explainer.shap_values(input_df)
        
        # Handle different SHAP output formats
        if isinstance(shap_values, list):
            # For multi-class or multi-output models
            shap_vals = shap_values[0][0] if len(shap_values[0].shape) > 1 else shap_values[0]
        else:
            # For single output models
            shap_vals = shap_values[0] if len(shap_values.shape) > 1 else shap_values
        
        # Get feature names
        feature_names = input_df.columns.tolist()
        
        # Ensure we have the right number of SHAP values
        if len(shap_vals) != len(feature_names):
            print(f"Mismatch: {len(shap_vals)} SHAP values vs {len(feature_names)} features")
            return [], []
        
        # Create feature importance dictionary
        feature_importance = {}
        for i, feature in enumerate(feature_names):
            feature_importance[feature] = abs(float(shap_vals[i]))
        
        # Calculate total importance for percentage calculation
        total_importance = sum(feature_importance.values())
        
        if total_importance == 0:
            print("Total importance is zero, returning empty lists")
            return [], []
        
        # Calculate category-wise importance
        category_importance = {}
        category_details = {}
        
        for category, features in FEATURE_CATEGORIES.items():
            category_total = 0
            category_features = []
            
            for feature in features:
                if feature in feature_importance:
                    importance = feature_importance[feature]
                    category_total += importance
                    category_features.append({
                        'feature': feature,
                        'importance': importance,
                        'contribution': float(shap_vals[feature_names.index(feature)])
                    })
            
            if category_total > 0:
                category_importance[category] = category_total
                category_details[category] = {
                    'total_importance': category_total,
                    'percentage': (category_total / total_importance) * 100,
                    'features': sorted(category_features, key=lambda x: x['importance'], reverse=True)
                }
        
        # Create category breakdown for pie chart
        category_breakdown = []
        for category, details in category_details.items():
            category_breakdown.append({
                'name': category,
                'value': details['total_importance'],
                'percentage': round(details['percentage'], 2),
                'top_features': [f['feature'] for f in details['features'][:2]]  # Top 2 features in category
            })
        
        # Sort categories by importance
        category_breakdown = sorted(category_breakdown, key=lambda x: x['value'], reverse=True)
        
        # Get top individual features across all categories
        all_features_sorted = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        top_individual_features_list = []
        
        for feature, importance in all_features_sorted[:top_individual_features]:
            percentage = (importance / total_importance) * 100
            if percentage > 1:  # Only include features with >1% contribution
                # Find which category this feature belongs to
                feature_category = "Other"
                for cat, features in FEATURE_CATEGORIES.items():
                    if feature in features:
                        feature_category = cat
                        break
                
                top_individual_features_list.append({
                    'feature': feature,
                    'category': feature_category,
                    'contribution': float(shap_vals[feature_names.index(feature)]),
                    'importance': float(importance),
                    'percentage': round(percentage, 2)
                })
        
        print(f"Category-based breakdown: {category_breakdown}")
        print(f"Top individual features: {top_individual_features_list}")
        
        return category_breakdown, top_individual_features_list
        
    except Exception as e:
        print(f"Error calculating SHAP values: {str(e)}")
        import traceback
        traceback.print_exc()
        return [], []

def generate_category_based_recommendations(data, category_breakdown, top_features):
    """
    Generate recommendations based on category importance and top features
    """
    print(f"Generating recommendations based on categories: {[c['name'] for c in category_breakdown]}")
    
    recommendations = []
    
    # Category-specific recommendation templates
    category_recommendations = {
        'Personal Information': {
            'Diet': {
                'omnivore': {
                    'title': 'Adopt a more plant-based diet',
                    'description': 'Your diet significantly impacts your carbon footprint. Try reducing meat consumption and incorporating more plant-based meals.',
                    'impact': 'high'
                },
                'vegetarian': {
                    'title': 'Optimize your vegetarian diet',
                    'description': 'Great dietary choice! Focus on local, organic produce and consider reducing dairy consumption.',
                    'impact': 'medium'
                },
                'vegan': {
                    'title': 'Maintain your sustainable diet',
                    'description': 'Excellent choice! Continue focusing on local, seasonal produce to minimize transportation emissions.',
                    'impact': 'low'
                }
            },
            'Body Type': {
                'default': {
                    'title': 'Maintain healthy lifestyle choices',
                    'description': 'Your personal characteristics influence your baseline footprint. Focus on sustainable lifestyle choices.',
                    'impact': 'low'
                }
            }
        },
        'Transportation': {
            'high_impact': {
                'title': 'Revolutionize your transportation',
                'description': 'Transportation is your biggest carbon contributor. Consider electric vehicles, public transport, or remote work options.',
                'impact': 'high'
            },
            'medium_impact': {
                'title': 'Optimize your transportation choices',
                'description': 'Transportation significantly impacts your footprint. Try carpooling, combining trips, or using more efficient vehicles.',
                'impact': 'medium'
            }
        },
        'Lifestyle': {
            'high_impact': {
                'title': 'Adopt sustainable lifestyle habits',
                'description': 'Your lifestyle choices significantly impact your footprint. Focus on reducing consumption and energy use.',
                'impact': 'high'
            },
            'medium_impact': {
                'title': 'Fine-tune your lifestyle choices',
                'description': 'Your lifestyle contributes notably to your footprint. Consider reducing screen time and consumption.',
                'impact': 'medium'
            }
        },
        'Waste & Consumption': {
            'high_impact': {
                'title': 'Minimize waste and consumption',
                'description': 'Your consumption patterns significantly impact your footprint. Focus on reducing, reusing, and recycling.',
                'impact': 'high'
            },
            'medium_impact': {
                'title': 'Improve waste management',
                'description': 'Your waste habits contribute to your footprint. Enhance recycling and reduce unnecessary purchases.',
                'impact': 'medium'
            }
        },
        'Home Energy': {
            'high_impact': {
                'title': 'Upgrade your home energy systems',
                'description': 'Your home energy use significantly impacts your footprint. Consider renewable energy and efficient appliances.',
                'impact': 'high'
            },
            'medium_impact': {
                'title': 'Improve home energy efficiency',
                'description': 'Your home energy contributes to your footprint. Focus on insulation and energy-efficient appliances.',
                'impact': 'medium'
            }
        }
    }
    
    # Generate recommendations based on category importance
    for i, category in enumerate(category_breakdown[:3]):  # Top 3 categories
        category_name = category['name']
        percentage = category['percentage']
        
        if category_name in category_recommendations:
            if category_name == 'Personal Information':
                # Handle diet-specific recommendations
                diet = data.get('Diet', '').lower()
                if diet in category_recommendations[category_name]['Diet']:
                    rec = category_recommendations[category_name]['Diet'][diet].copy()
                else:
                    rec = category_recommendations[category_name]['Body Type']['default'].copy()
            else:
                # Handle other categories based on impact level
                impact_level = 'high_impact' if percentage > 25 else 'medium_impact'
                if impact_level in category_recommendations[category_name]:
                    rec = category_recommendations[category_name][impact_level].copy()
                else:
                    continue
            
            rec['category'] = category_name
            rec['description'] = f"This category contributes {percentage}% to your footprint. " + rec['description']
            recommendations.append(rec)
    
    # Add specific feature-based recommendations
    feature_specific_recommendations = {
        'Vehicle Monthly Distance Km': {
            'title': 'Reduce driving distance',
            'description': 'Your monthly driving distance is a major factor. Consider working from home, carpooling, or using public transport.',
            'impact': 'high'
        },
        'Monthly Grocery Bill': {
            'title': 'Optimize food spending and choices',
            'description': 'Your grocery spending indicates consumption patterns. Focus on local, seasonal, and less processed foods.',
            'impact': 'medium'
        },
        'How Many New Clothes Monthly': {
            'title': 'Reduce clothing consumption',
            'description': 'Your clothing purchases significantly impact your footprint. Try second-hand shopping and extending garment life.',
            'impact': 'medium'
        },
        'Waste Bag Weekly Count': {
            'title': 'Minimize waste generation',
            'description': 'Your waste production is significant. Focus on reducing packaging, composting, and reusing items.',
            'impact': 'high'
        }
    }
    
    # Add recommendations for top individual features
    for feature_info in top_features[:2]:  # Top 2 individual features
        feature_name = feature_info['feature']
        percentage = feature_info['percentage']
        
        if feature_name in feature_specific_recommendations:
            rec = feature_specific_recommendations[feature_name].copy()
            rec['category'] = feature_info['category']
            rec['description'] = f"This factor contributes {percentage}% individually. " + rec['description']
            recommendations.append(rec)
    
    # Add general recommendations based on data
    if data.get('Energy efficiency') == 'No':
        recommendations.append({
            'category': 'Home Energy',
            'title': 'Improve energy efficiency',
            'description': 'You indicated low energy efficiency awareness. Upgrade to LED lighting and energy-efficient appliances.',
            'impact': 'medium'
        })
    
    recycling = data.get('Recycling', [])
    if not recycling or 'None' in str(recycling):
        recommendations.append({
            'category': 'Waste & Consumption',
            'title': 'Start comprehensive recycling',
            'description': 'You\'re not recycling effectively. Implement proper sorting for paper, plastic, glass, and metal.',
            'impact': 'medium'
        })
    
    # Remove duplicates and limit to top 5
    unique_recommendations = []
    seen_titles = set()
    for rec in recommendations:
        if rec['title'] not in seen_titles:
            unique_recommendations.append(rec)
            seen_titles.add(rec['title'])
    
    print(f"Generated {len(unique_recommendations)} unique recommendations")
    return unique_recommendations[:5]

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        data = request.get_json(force=True)
        print(f"Received data for prediction: {data}")

        # Preprocess input
        input_df = preprocess_input_for_catboost(data)

        # Create Pool with categorical feature info
        cat_features = [
           'Body Type', 'Sex', 'Diet', 'How Often Shower', 'Heating Energy Source',
            'Transport', 'Vehicle Type', 'Social Activity', 'Frequency of Traveling by Air',
            'Waste Bag Size', 'Energy efficiency', 'Recycling', 'Cooking_With'
        ]
        input_pool = Pool(data=input_df, cat_features=cat_features)

        # Predict using Pool
        prediction = float(abs(model.predict(input_pool)[0]))

        # SHAP + Recommendations
        category_breakdown, top_features = get_category_based_shap_importance(input_df)
        recommendations = generate_category_based_recommendations(data, category_breakdown, top_features)

        return jsonify({
            'prediction': prediction,
            'category_breakdown': category_breakdown,
            'top_individual_features': top_features,
            'recommendations': recommendations
        })

    except Exception as e:
        print(f"❌ Error in /predict: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/insights', methods=['POST'])
def get_insights():
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
            
        data = request.json.get('carbonData', {})
        print(f"Received data for insights: {data}")
        
        # Preprocess input for CatBoost
        input_df = preprocess_input_for_catboost(data)
        
        # Make prediction
        prediction = model.predict(input_df)[0]
        prediction = abs(float(prediction))  # Ensure positive value
        
        print(f"Carbon emission prediction: {prediction}")
        
        # Get category-based SHAP importance
        category_breakdown, top_features = get_category_based_shap_importance(input_df)
        
        # Generate targeted recommendations based on categories
        recommendations = generate_category_based_recommendations(data, category_breakdown, top_features)
        
        # Build comprehensive insights response
        insights = {
            'category_breakdown': category_breakdown,
            'top_individual_features': top_features,
            'recommendations': recommendations
        }
        
        return jsonify({
            'carbonEmission': prediction,
            'insights': insights
        })
        
    except Exception as e:
        print(f"Error in /insights: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    status = {
        'status': 'healthy',
        'model_loaded': model is not None,
        'shap_available': explainer is not None
    }
    return jsonify(status)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
