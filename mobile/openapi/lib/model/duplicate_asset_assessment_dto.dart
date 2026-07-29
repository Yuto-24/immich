//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateAssetAssessmentDto {
  /// Returns a new [DuplicateAssetAssessmentDto] instance.
  DuplicateAssetAssessmentDto({
    required this.assetId,
    required this.captureTimeSource,
    required this.classifierVersion,
    required this.confidence,
    this.evidence = const [],
    required this.provenance,
    required this.recommendedAction,
  });

  /// Assessed asset ID
  String assetId;

  CaptureTimeSource captureTimeSource;

  /// Version of the provenance classifier
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int classifierVersion;

  ProvenanceConfidence confidence;

  /// Human-readable provenance evidence
  List<String> evidence;

  AssetProvenance provenance;

  /// Recommended action for this asset
  DuplicateAssetAssessmentDtoRecommendedActionEnum recommendedAction;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateAssetAssessmentDto &&
    other.assetId == assetId &&
    other.captureTimeSource == captureTimeSource &&
    other.classifierVersion == classifierVersion &&
    other.confidence == confidence &&
    _deepEquality.equals(other.evidence, evidence) &&
    other.provenance == provenance &&
    other.recommendedAction == recommendedAction;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (captureTimeSource.hashCode) +
    (classifierVersion.hashCode) +
    (confidence.hashCode) +
    (evidence.hashCode) +
    (provenance.hashCode) +
    (recommendedAction.hashCode);

  @override
  String toString() => 'DuplicateAssetAssessmentDto[assetId=$assetId, captureTimeSource=$captureTimeSource, classifierVersion=$classifierVersion, confidence=$confidence, evidence=$evidence, provenance=$provenance, recommendedAction=$recommendedAction]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'captureTimeSource'] = this.captureTimeSource;
      json[r'classifierVersion'] = this.classifierVersion;
      json[r'confidence'] = this.confidence;
      json[r'evidence'] = this.evidence;
      json[r'provenance'] = this.provenance;
      json[r'recommendedAction'] = this.recommendedAction;
    return json;
  }

  /// Returns a new [DuplicateAssetAssessmentDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateAssetAssessmentDto? fromJson(dynamic value) {
    upgradeDto(value, "DuplicateAssetAssessmentDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateAssetAssessmentDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        captureTimeSource: CaptureTimeSource.fromJson(json[r'captureTimeSource'])!,
        classifierVersion: mapValueOfType<int>(json, r'classifierVersion')!,
        confidence: ProvenanceConfidence.fromJson(json[r'confidence'])!,
        evidence: json[r'evidence'] is Iterable
            ? (json[r'evidence'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        provenance: AssetProvenance.fromJson(json[r'provenance'])!,
        recommendedAction: DuplicateAssetAssessmentDtoRecommendedActionEnum.fromJson(json[r'recommendedAction'])!,
      );
    }
    return null;
  }

  static List<DuplicateAssetAssessmentDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateAssetAssessmentDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateAssetAssessmentDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateAssetAssessmentDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateAssetAssessmentDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateAssetAssessmentDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateAssetAssessmentDto-objects as value to a dart map
  static Map<String, List<DuplicateAssetAssessmentDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateAssetAssessmentDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateAssetAssessmentDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'captureTimeSource',
    'classifierVersion',
    'confidence',
    'evidence',
    'provenance',
    'recommendedAction',
  };
}

/// Recommended action for this asset
class DuplicateAssetAssessmentDtoRecommendedActionEnum {
  /// Instantiate a new enum with the provided [value].
  const DuplicateAssetAssessmentDtoRecommendedActionEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const keep = DuplicateAssetAssessmentDtoRecommendedActionEnum._(r'keep');
  static const trash = DuplicateAssetAssessmentDtoRecommendedActionEnum._(r'trash');
  static const review = DuplicateAssetAssessmentDtoRecommendedActionEnum._(r'review');

  /// List of all possible values in this [enum][DuplicateAssetAssessmentDtoRecommendedActionEnum].
  static const values = <DuplicateAssetAssessmentDtoRecommendedActionEnum>[
    keep,
    trash,
    review,
  ];

  static DuplicateAssetAssessmentDtoRecommendedActionEnum? fromJson(dynamic value) => DuplicateAssetAssessmentDtoRecommendedActionEnumTypeTransformer().decode(value);

  static List<DuplicateAssetAssessmentDtoRecommendedActionEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateAssetAssessmentDtoRecommendedActionEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateAssetAssessmentDtoRecommendedActionEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [DuplicateAssetAssessmentDtoRecommendedActionEnum] to String,
/// and [decode] dynamic data back to [DuplicateAssetAssessmentDtoRecommendedActionEnum].
class DuplicateAssetAssessmentDtoRecommendedActionEnumTypeTransformer {
  factory DuplicateAssetAssessmentDtoRecommendedActionEnumTypeTransformer() => _instance ??= const DuplicateAssetAssessmentDtoRecommendedActionEnumTypeTransformer._();

  const DuplicateAssetAssessmentDtoRecommendedActionEnumTypeTransformer._();

  String encode(DuplicateAssetAssessmentDtoRecommendedActionEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a DuplicateAssetAssessmentDtoRecommendedActionEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  DuplicateAssetAssessmentDtoRecommendedActionEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'keep': return DuplicateAssetAssessmentDtoRecommendedActionEnum.keep;
        case r'trash': return DuplicateAssetAssessmentDtoRecommendedActionEnum.trash;
        case r'review': return DuplicateAssetAssessmentDtoRecommendedActionEnum.review;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [DuplicateAssetAssessmentDtoRecommendedActionEnumTypeTransformer] instance.
  static DuplicateAssetAssessmentDtoRecommendedActionEnumTypeTransformer? _instance;
}


